// lib/aiService.ts  
import { promptRouter, PromptRouterResult } from "./promptRouter";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AIResponse {
  type: 'data' | 'conversational' | 'error';
  content: string;
  functionUsed?: string;
  data?: any;
  confidence?: number;
  reasoning?: string;
}

export class AIService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  /**
   * Main entry point for processing user queries
   */
  async processQuery(query: string, history: any[] = []): Promise<AIResponse> {
    try {
      // Classify intent first
      const intent = await this.classifyIntent(query, history);
      
      if (intent === 'conversational') {
        return await this.handleConversationalQuery(query, history);
      } else {
        return await this.handleDataQuery(query, history);
      }
      
    } catch (error) {
      console.error("❌ AI Service error:", error);
      return {
        type: 'error',
        content: `Sorry, I encountered an error processing your request: ${error.message}`
      };
    }
  }

  /**
   * Classify user intent as conversational or data query
   */
  private async classifyIntent(query: string, history: any[]): Promise<'conversational' | 'data'> {
    const prompt = `
You are an intent classifier for a business AI assistant.
Determine if the user's query is conversational or requires data from the database.

- **Conversational**: Greetings, thank you, how are you, general questions not related to business data, casual chat
- **Data**: Questions about sales, products, customers, revenue, inventory, transactions, companies, etc.

Recent History (for context):
${JSON.stringify(history.slice(-3), null, 2)}

User Query: "${query}"

Return only: "conversational" or "data"`;

    try {
      const result = await this.model.generateContent(prompt);
      const classification = result.response.text().trim().toLowerCase();
      
      if (classification.includes('data')) return 'data';
      return 'conversational';
      
    } catch (error) {
      console.error("❌ Intent classification failed:", error);
      return 'data'; // Default to data query to be safe
    }
  }

  /**
   * Handle conversational queries (greetings, general questions)
   */
  private async handleConversationalQuery(query: string, history: any[]): Promise<AIResponse> {
    const prompt = `
You are a friendly AI assistant for a sales dashboard system. The user is having a casual conversation.

Conversation History:
${history.map(h => `${h.sender}: ${h.content}`).join('\n')}

User: ${query}

Respond naturally and helpfully. If they ask what you can do, mention you can help with:
- Sales data and reports
- Product information and inventory
- Transaction analysis
- Company and supplier information
- Category insights
- Admin management

Keep responses concise and engaging.`;

    try {
      const result = await this.model.generateContent(prompt);
      return {
        type: 'conversational',
        content: result.response.text().trim()
      };
    } catch (error) {
      return {
        type: 'conversational',
        content: "Hello! I'm here to help you with your sales dashboard. You can ask me about products, sales, transactions, companies, and more!"
      };
    }
  }

  /**
   * Handle data queries using the prompt router
   */
  private async handleDataQuery(query: string, history: any[]): Promise<AIResponse> {
    // Route query to appropriate function
    const routerResult: PromptRouterResult = await promptRouter.routeAndExecute(query);
    
    if (!routerResult.success) {
      return {
        type: 'error',
        content: routerResult.fallbackResponse || routerResult.error || "I couldn't process your data request.",
      };
    }

    // Format the response with the data
    const formattedResponse = await this.formatDataResponse(query, routerResult);
    
    return {
      type: 'data',
      content: formattedResponse,
      functionUsed: routerResult.match?.functionName,
      data: routerResult.result,
      confidence: routerResult.match?.confidence,
      reasoning: routerResult.match?.reasoning
    };
  }

  /**
   * Format data results into a natural language response
   */
  private async formatDataResponse(originalQuery: string, routerResult: PromptRouterResult): Promise<string> {
    try {
      const { result, match } = routerResult;
      
      if (!result || !match) {
        return "I found the function but couldn't retrieve the data.";
      }

      // Handle different result types
      let dataPreview = "";
      if (Array.isArray(result)) {
        dataPreview = `Found ${result.length} results. Sample: ${JSON.stringify(result.slice(0, 2), null, 2)}`;
      } else if (typeof result === 'object') {
        dataPreview = JSON.stringify(result, null, 2);
      } else {
        dataPreview = String(result);
      }

      const prompt = `
User asked: "${originalQuery}"
Function used: ${match.functionName}
Function parameters: ${JSON.stringify(match.parameters)}

Raw data result:
${dataPreview}

Create a natural, conversational response that:
1. Directly answers the user's question
2. Presents the key information clearly
3. Uses tables or lists for multiple items
4. Includes relevant numbers and insights
5. Stays concise but informative

If the data is empty or null, explain that no results were found for their query.
Format numbers nicely (e.g., $1,234.56 for currency, 1,234 for counts).
Use markdown formatting for better readability.`;

      const response = await this.model.generateContent(prompt);
      return response.response.text().trim();
      
    } catch (error) {
      console.error("❌ Response formatting error:", error);
      
      // Fallback to simple formatting
      if (Array.isArray(routerResult.result)) {
        return `Found ${routerResult.result.length} results for your query about ${routerResult.match?.functionName || 'the requested function'}.`;
      } else {
        return `Here's the result for your query: ${JSON.stringify(routerResult.result)}`;
      }
    }
  }

  /**
   * Get suggestions for user queries
   */
  async getSuggestions(category?: string): Promise<string[]> {
    const functions = await promptRouter.getAvailableFunctions(category);
    
    // Get top examples from each function
    const suggestions: string[] = [];
    functions.slice(0, 5).forEach(fn => {
      suggestions.push(...fn.examples.slice(0, 2));
    });
    
    return suggestions.slice(0, 10); // Return top 10 suggestions
  }

  /**
   * Test the system with example queries
   */
  async testQuery(query: string): Promise<{ query: string; response: AIResponse }> {
    const response = await this.processQuery(query);
    return { query, response };
  }
}

// Export singleton instance
export const aiService = new AIService();
