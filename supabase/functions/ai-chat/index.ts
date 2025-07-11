import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { corsHeaders } from '../_shared/cors.ts';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

interface ChatMessage {
  sender: string;
  content: string;
  timestamp?: string;
}

interface TableInfo {
  table_name: string;
  description?: string;
  columns: Array<{ column_name: string; data_type: string }>;
  relationships?: Array<{ from_column: string; to_table: string; to_column: string }>;
}

// --- 1. INTENT CLASSIFIER ---
class IntentClassifier {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  async classify(query: string, _history: ChatMessage[]): Promise<'conversational' | 'data_query'> {
    const prompt = `
      You are an intent classifier for a business AI assistant.
      Your task is to determine if the user's query is a general conversation or a request for data from a database.

      **Data Query Examples:**
      - "What are our top selling products?"
      - "Show me recent transactions"
      - "List all companies from USA"
      - "What products are out of stock?"
      - "What is our total sales this month?"
      - "How many customers do we have?"
      - "What are our revenue numbers?"
      - "Show me all admins"
      - "List products in category X"

      **Conversational Examples:**
      - "Hello", "Hi", "How are you?"
      - "Thank you", "Thanks"
      - "What can you do?", "Help me"
      - "Good morning", "Good bye"
      - "How do you work?", "Who created you?"

      User Query: "${query}"

      Based on the query, is this 'conversational' or 'data_query'?
      Return ONLY the classification word.
    `;
    try {
      const result = await this.model.generateContent(prompt);
      const classification = result.response.text().trim().toLowerCase();
      
      // More aggressive data query detection
      if (classification.includes('data_query') || classification.includes('data')) {
        return 'data_query';
      }
      
      // Check if query contains data-related keywords
      const dataKeywords = ['show', 'list', 'what', 'how many', 'total', 'count', 'products', 'sales', 'revenue', 'transactions', 'companies', 'customers', 'admins', 'stock', 'inventory'];
      const queryLower = query.toLowerCase();
      
      for (const keyword of dataKeywords) {
        if (queryLower.includes(keyword)) {
          return 'data_query';
        }
      }
      
      return 'conversational';
    } catch (e) {
      console.error("Intent classification failed:", e);
      // Default to data_query for better UX
      return 'data_query';
    }
  }
}

// --- 2. CONVERSATIONAL RESPONDER ---
class ConversationalResponder {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  async generateResponse(query: string, history: ChatMessage[]): Promise<string> {
    const prompt = `
      You are Stella, a friendly and helpful AI business assistant.
      The user is having a general conversation with you. Respond naturally and helpfully.
      DO NOT try to query a database or generate SQL.

      Conversation History:
      ${JSON.stringify(history.slice(-4), null, 2)}

      User's Latest Message: "${query}"

      Your response:
    `;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.error("Conversational response failed:", e);
      return "I'm sorry, I had trouble processing that. Could you try rephrasing?";
    }
  }
}

// --- 3. DYNAMIC QUERY ENGINE (FINAL, STRICT VERSION) ---
class DynamicQueryEngine {
  private model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro-latest',
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
  });

  constructor(private supabase: SupabaseClient) {}

  private async getSchema(): Promise<string> {
    const { data, error } = await this.supabase.rpc('get_schema_info');
    if (error) {
      console.error('Schema analysis failed:', error);
      return 'Database schema information unavailable';
    }
    return data.map((table: TableInfo) => {
        let tableInfo = `Table \`${table.table_name}\`:\n`;
        if (table.description) tableInfo += `  - Description: ${table.description}\n`;
        tableInfo += `  - Columns: ${table.columns.map((c) => `${c.column_name} (${c.data_type})`).join(', ')}\n`;
        if (table.relationships && table.relationships.length > 0) {
            tableInfo += `  - Relationships: ${table.relationships.map((r) => `\`${r.from_column}\` -> \`${r.to_table}\`.\`${r.to_column}\``).join(', ')}\n`;
        }
        return tableInfo;
    }).join('\n');
  }

  async generateAndExecute(query: string, _history: ChatMessage[]): Promise<string> {
    // First, check if the query requires specific parameters that aren't provided
    const parameterCheckPrompt = `
      Analyze this user query to see if it requires specific parameters that aren't provided:
      
      Query: "${query}"
      
      Examples that need more information:
      - "Add a product" -> needs product details
      - "Update product X" -> needs what to update
      - "Delete company" -> needs which company
      - "Show sales for" -> needs time period or location
      
      Examples that are complete:
      - "Show all products"
      - "List companies from USA"
      - "What are top selling products"
      
      If this query needs more specific information, respond with "NEEDS_INFO:" followed by what information is needed.
      If the query is complete, respond with "COMPLETE".
    `;

    try {
      const paramCheck = await this.model.generateContent(parameterCheckPrompt);
      const paramResponse = paramCheck.response.text().trim();
      
      if (paramResponse.startsWith('NEEDS_INFO:')) {
        const neededInfo = paramResponse.replace('NEEDS_INFO:', '').trim();
        return `I'd be happy to help you with that! To proceed, I need some additional information:\n\n${neededInfo}\n\nCould you please provide these details?`;
      }
    } catch (error) {
      console.error('Parameter check failed:', error);
      // Continue with normal processing
    }

    // Generate and execute the query
    const schema = await this.getSchema();
    const prompt = `
      You are a business data analyst. Generate a PostgreSQL query to answer the user's question.
      
      DATABASE SCHEMA:
      ${schema}
      
      USER QUESTION: "${query}"
      
      RULES:
      1. Only use tables and columns from the schema above
      2. No INSERT, UPDATE, DELETE - only SELECT queries
      3. Add LIMIT 20 unless user specifies otherwise
      4. For "companies from USA" use WHERE country = 'USA'
      5. For "top selling products" join products and transactions
      6. Return only the SQL query, no explanation
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const sqlQuery = result.response.text().trim().replace(/```sql/g, '').replace(/```/g, '').trim();
      
      // Execute the query
      const { data, error } = await this.supabase.rpc('execute_sql', { query: sqlQuery });
      
      if (error) {
        console.error('SQL execution error:', error);
        return "I apologize, but I encountered an error while retrieving the data. The query might not be compatible with your database structure. Could you try rephrasing your question?";
      }

      // Format the response naturally
      if (!data || data.length === 0) {
        return "I searched through the database but didn't find any results matching your query. This might mean:\n\n• The data doesn't exist yet\n• The search criteria were too specific\n• There might be a different way to phrase your question\n\nWould you like to try a different approach?";
      }

      // Generate a natural language response
      const responsePrompt = `
        The user asked: "${query}"
        
        I executed a database query and got these results:
        ${JSON.stringify(data.slice(0, 5), null, 2)}
        
        Create a natural, conversational response that:
        1. Directly answers their question
        2. Presents the data in a friendly way
        3. Uses bullet points or tables if helpful
        4. Mentions if there are more results than shown
        5. Is concise but informative
        
        Don't mention SQL, databases, or technical details. Just answer like a helpful business assistant.
      `;

      const finalResponse = await this.model.generateContent(responsePrompt);
      return finalResponse.response.text().trim();

    } catch (error) {
      console.error('Query generation/execution error:', error);
      return "I'm having trouble processing your request right now. Could you try rephrasing your question or asking something else?";
    }
  }
}

// --- MAIN FUNCTION ---
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, query, history, conversationId } = await req.json();
    
    // Support both 'message' and 'query' for backward compatibility
    const userQuery = message || query;
    
    if (!userQuery) {
      throw new Error('No message or query provided');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const classifier = new IntentClassifier();
    const intent = await classifier.classify(userQuery, history || []);

    let responseText = "";
    let responseType = "";
    let functionUsed = "";

    if (intent === 'conversational') {
      const responder = new ConversationalResponder();
      responseText = await responder.generateResponse(userQuery, history || []);
      responseType = 'conversational';
    } else {
      const engine = new DynamicQueryEngine(supabaseAdmin);
      responseText = await engine.generateAndExecute(userQuery, history || []);
      responseType = 'data';
      functionUsed = 'dynamic_sql_query';
    }

    return new Response(JSON.stringify({ 
      content: responseText,
      type: responseType,
      functionUsed: functionUsed || undefined,
      conversationId: conversationId || undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = `I'm sorry, I encountered an error: ${errorMessage}`;
    return new Response(JSON.stringify({ 
      content: errorResponse,
      type: 'error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});