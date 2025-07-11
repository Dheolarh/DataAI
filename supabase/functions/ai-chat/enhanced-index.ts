// Enhanced AI chat function with prompt router integration
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { corsHeaders } from '../_shared/cors.ts';

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);

// Import your function definitions and prompt patterns
// Note: This would need to be adapted for Deno edge functions
// You might need to inline some of these or use dynamic imports

interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string | number | boolean;
  }>;
  examples: string[];
  category: string;
}

interface TableInfo {
  table_name: string;
  columns: Array<{ column_name: string; data_type: string }>;
}

interface FunctionResult {
  [key: string]: string | number | boolean | null;
}

interface ChatMessage {
  sender: string;
  content: string;
  timestamp?: string;
}

// Simplified function registry for the edge function
// This is a subset of your main registry with key functions
const EDGE_FUNCTION_REGISTRY: Record<string, FunctionDefinition> = {
  getTopSellingProducts: {
    name: "getTopSellingProducts",
    description: "Get the best-selling products ranked by total quantity sold",
    parameters: [
      { name: "limit", type: "number", required: false, description: "Number of products to return", defaultValue: 5 }
    ],
    examples: [
      "What are the top selling products?",
      "Show me the best sellers",
      "Which products sold the most?"
    ],
    category: "products"
  },
  getTotalSales: {
    name: "getTotalSales", 
    description: "Get total sales revenue within a date range",
    parameters: [
      { name: "startDate", type: "string", required: false, description: "Start date (YYYY-MM-DD format)" },
      { name: "endDate", type: "string", required: false, description: "End date (YYYY-MM-DD format)" }
    ],
    examples: [
      "What are total sales for January 2024?",
      "Sales revenue this month",
      "Total sales between Jan 1 and Jan 31"
    ],
    category: "transactions"
  },
  getRecentTransactions: {
    name: "getRecentTransactions",
    description: "Get the most recent transactions",
    parameters: [
      { name: "limit", type: "number", required: false, description: "Number of transactions to return", defaultValue: 10 }
    ],
    examples: [
      "Show me recent transactions",
      "Latest sales",
      "Last 20 transactions"
    ],
    category: "transactions"
  }
};

// --- ENHANCED INTENT CLASSIFIER ---
class EnhancedIntentClassifier {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  async classify(query: string, history: ChatMessage[]): Promise<'conversational' | 'function_call' | 'sql_query'> {
    const prompt = `
You are an advanced intent classifier for a business AI assistant.
Classify the user's query into one of three categories:

1. **conversational**: Greetings, thank you, casual chat, general questions
2. **function_call**: Specific business queries that can be answered with predefined functions (products, sales, transactions, etc.)
3. **sql_query**: Complex analytical queries requiring custom SQL generation

Available function categories: products, transactions, companies, categories, admins

History: ${JSON.stringify(history.slice(-3), null, 2)}
Query: "${query}"

Return only: "conversational", "function_call", or "sql_query"`;

    try {
      const result = await this.model.generateContent(prompt);
      const classification = result.response.text().trim().toLowerCase();
      
      if (classification.includes('conversational')) return 'conversational';
      if (classification.includes('function_call')) return 'function_call';
      return 'sql_query';
    } catch (e) {
      console.error("Intent classification failed:", e);
      return 'function_call'; // Default to function call
    }
  }
}

// --- FUNCTION MATCHER AND EXECUTOR ---
class FunctionMatcher {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
  
  constructor(private supabase: SupabaseClient) {}

  async matchAndExecute(query: string): Promise<string> {
    try {
      // Find best matching function
      const match = await this.findBestFunction(query);
      if (!match) {
        return "I couldn't find a suitable function for your query. Try asking about products, sales, or transactions.";
      }

      // Extract parameters
      const parameters = await this.extractParameters(query, match);
      
      // Execute via SQL (since we're in Supabase edge function)
      const result = await this.executeFunction(match.name, parameters);
      
      // Format response
      return await this.formatResponse(query, match, result);
      
    } catch (error) {
      console.error("Function matching error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `Sorry, I encountered an error: ${errorMessage}`;
    }
  }

  private async findBestFunction(query: string): Promise<FunctionDefinition | null> {
    const functionList = Object.values(EDGE_FUNCTION_REGISTRY);
    
    const prompt = `
Find the best function for: "${query}"

Available functions:
${functionList.map(f => `${f.name}: ${f.description}\nExamples: ${f.examples.join(', ')}`).join('\n\n')}

Return the exact function name or "none" if no match.`;

    try {
      const result = await this.model.generateContent(prompt);
      const functionName = result.response.text().trim();
      
      return EDGE_FUNCTION_REGISTRY[functionName] || null;
    } catch (error) {
      console.error("Function matching failed:", error);
      return null;
    }
  }

  private async extractParameters(query: string, func: FunctionDefinition): Promise<Record<string, string | number | boolean>> {
    if (func.parameters.length === 0) return {};

    const prompt = `
Extract parameters from "${query}" for function "${func.name}":

Parameters:
${func.parameters.map(p => `- ${p.name} (${p.type}): ${p.description}${p.required ? ' [REQUIRED]' : ''}`).join('\n')}

Return JSON object with extracted values:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      const extracted = JSON.parse(response);
      
      // Apply defaults
      const finalParams = { ...extracted };
      for (const param of func.parameters) {
        if (!(param.name in finalParams) && param.defaultValue !== undefined) {
          finalParams[param.name] = param.defaultValue;
        }
      }
      
      return finalParams;
    } catch (error) {
      console.error("Parameter extraction failed:", error);
      return {};
    }
  }

  private async executeFunction(functionName: string, parameters: Record<string, string | number | boolean>): Promise<FunctionResult[]> {
    // Map function calls to SQL queries
    const sqlMappings: Record<string, string> = {
      getTopSellingProducts: `
        SELECT p.name, p.sku, SUM(t.quantity) as total_sold
        FROM products p
        JOIN transactions t ON p.id = t.product_id
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_sold DESC
        LIMIT ${parameters.limit || 5}`,
        
      getTotalSales: `
        SELECT 
          SUM(total_amount) as total_revenue,
          COUNT(*) as transaction_count
        FROM transactions
        ${parameters.startDate ? `WHERE transaction_time >= '${parameters.startDate}'` : ''}
        ${parameters.endDate ? `AND transaction_time <= '${parameters.endDate}'` : ''}`,
        
      getRecentTransactions: `
        SELECT 
          t.id,
          p.name as product_name,
          t.quantity,
          t.unit_price,
          t.total_amount,
          t.location,
          t.transaction_time
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        ORDER BY t.transaction_time DESC
        LIMIT ${parameters.limit || 10}`
    };

    const sql = sqlMappings[functionName];
    if (!sql) {
      throw new Error(`Function ${functionName} not implemented`);
    }

    const { data, error } = await this.supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }

    return data;
  }

  private async formatResponse(query: string, func: FunctionDefinition, result: FunctionResult[]): Promise<string> {
    const prompt = `
User asked: "${query}"
Function used: ${func.name}
Result: ${JSON.stringify(result, null, 2)}

Create a natural, helpful response that:
1. Directly answers the question
2. Presents data clearly (use tables for multiple items)
3. Includes key insights
4. Uses proper formatting

If no data, explain that no results were found.`;

    try {
      const response = await this.model.generateContent(prompt);
      return response.response.text().trim();
    } catch (_error) {
      // Fallback formatting
      if (Array.isArray(result)) {
        return `Found ${result.length} results for your query about ${func.description}.`;
      }
      return `Here's the result: ${JSON.stringify(result)}`;
    }
  }
}

// --- CONVERSATIONAL RESPONDER ---
class ConversationalResponder {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  async generateResponse(query: string, history: ChatMessage[]): Promise<string> {
    const prompt = `
You are a friendly AI assistant for a sales dashboard. 

History: ${JSON.stringify(history.slice(-4), null, 2)}
User: "${query}"

Respond naturally. If they ask what you can do, mention:
- Product information and inventory
- Sales data and reports  
- Transaction analysis
- Company and category insights

Keep it concise and helpful.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (_e) {
      return "Hello! I'm here to help with your sales dashboard. Ask me about products, sales, transactions, and more!";
    }
  }
}

// --- LEGACY SQL ENGINE (FALLBACK) ---
class LegacySQLEngine {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  constructor(private supabase: SupabaseClient) {}

  async generateAndExecute(query: string, _history: ChatMessage[]): Promise<string> {
    // Your existing SQL generation logic here
    // This serves as a fallback for complex queries not handled by functions
    
    const { data, error } = await this.supabase.rpc('get_schema_info');
    const schema = error ? 'Schema unavailable' : data.map((table: TableInfo) => {
      return `Table \`${table.table_name}\`: ${table.columns.map((c) => `${c.column_name} (${c.data_type})`).join(', ')}`;
    }).join('\n');

    const prompt = `
Generate SQL for: "${query}"

Schema: ${schema}

Return JSON with "sql" and "explanation" fields.
No semicolon at end. Add LIMIT 20.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
      
      const sql = response.sql.trim().replace(/;$/, '');
      const { data: queryData, error: queryError } = await this.supabase.rpc('execute_sql', { query: sql });

      let responseText = `💻 **SQL:** \`\`\`sql\n${sql}\n\`\`\`\n\n`;
      
      if (queryError) {
        responseText += `❌ **Error:** ${queryError.message}`;
      } else {
        const resultData = Array.isArray(queryData) ? queryData : [];
        responseText += `📊 **Results (${resultData.length} rows):**\n\n`;
        if (resultData.length > 0) {
          responseText += "```json\n" + JSON.stringify(resultData, null, 2) + "\n```";
        } else {
          responseText += "No results found.";
        }
      }
      
      return responseText;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      return `Error generating SQL query: ${errorMessage}`;
    }
  }
}

// --- MAIN FUNCTION ---
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, history } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const classifier = new EnhancedIntentClassifier();
    const intent = await classifier.classify(query, history);

    let responseText = "";

    if (intent === 'conversational') {
      const responder = new ConversationalResponder();
      responseText = await responder.generateResponse(query, history);
      
    } else if (intent === 'function_call') {
      const matcher = new FunctionMatcher(supabaseAdmin);
      responseText = await matcher.matchAndExecute(query);
      
    } else {
      // Fallback to SQL generation for complex queries
      const engine = new LegacySQLEngine(supabaseAdmin);
      responseText = await engine.generateAndExecute(query, history);
    }

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("AI Chat Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = `❌ **Error:** ${errorMessage}`;
    return new Response(JSON.stringify({ response: errorResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
