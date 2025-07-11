// lib/promptRouter.ts
import weaviate from "weaviate-ts-client";
import { generateEmbedding } from "./embed";
import { FUNCTION_REGISTRY, getFunctionByName, FunctionDefinition } from "./functionRegistry";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const weaviateClient = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_URL!.replace(/^https?:\/\//, ""),
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface FunctionMatch {
  functionName: string;
  confidence: number;
  parameters: Record<string, any>;
  reasoning: string;
}

export interface PromptRouterResult {
  success: boolean;
  match?: FunctionMatch;
  result?: any;
  error?: string;
  fallbackResponse?: string;
}

export class PromptRouter {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

  /**
   * Route a user query to the best matching function and execute it
   */
  async routeAndExecute(userQuery: string): Promise<PromptRouterResult> {
    try {
      console.log(`🔍 Routing query: "${userQuery}"`);
      
      // Step 1: Find best matching function using vector search
      const match = await this.findBestMatch(userQuery);
      
      if (!match) {
        return {
          success: false,
          error: "No matching function found",
          fallbackResponse: await this.generateFallbackResponse(userQuery)
        };
      }

      console.log(`✅ Found match: ${match.functionName} (confidence: ${match.confidence})`);

      // Step 2: Execute the function
      const result = await this.executeFunction(match);

      return {
        success: true,
        match,
        result
      };

    } catch (error) {
      console.error("❌ Prompt routing error:", error);
      return {
        success: false,
        error: error.message,
        fallbackResponse: await this.generateFallbackResponse(userQuery)
      };
    }
  }

  /**
   * Find the best matching function using Weaviate vector search + AI ranking
   */
  private async findBestMatch(userQuery: string): Promise<FunctionMatch | null> {
    try {
      // Generate embedding for user query
      const queryVector = await generateEmbedding(userQuery);

      // Search for similar prompt patterns in Weaviate
      const response = await weaviateClient.graphql
        .get()
        .withClassName("PromptPattern")
        .withFields("prompt functionName description category parameters confidence _additional {certainty}")
        .withNearVector({ vector: queryVector, certainty: 0.7 })
        .withLimit(5)
        .do();

      const matches = response.data.Get.PromptPattern || [];
      
      if (matches.length === 0) {
        console.log("⚠️ No vector matches found above certainty threshold");
        return await this.fallbackFunctionSearch(userQuery);
      }

      // Use AI to rank and select the best match
      const bestMatch = await this.rankMatches(userQuery, matches);
      
      if (!bestMatch) {
        return await this.fallbackFunctionSearch(userQuery);
      }

      // Extract parameters using AI
      const parameters = await this.extractParameters(userQuery, bestMatch);

      return {
        functionName: bestMatch.functionName,
        confidence: bestMatch._additional.certainty,
        parameters,
        reasoning: `Matched via vector search with ${(bestMatch._additional.certainty * 100).toFixed(1)}% confidence`
      };

    } catch (error) {
      console.error("❌ Vector search error:", error);
      return await this.fallbackFunctionSearch(userQuery);
    }
  }

  /**
   * Fallback function search using AI when vector search fails
   */
  private async fallbackFunctionSearch(userQuery: string): Promise<FunctionMatch | null> {
    try {
      console.log("🔄 Using AI fallback for function matching...");
      
      const functionList = FUNCTION_REGISTRY.map(fn => ({
        name: fn.name,
        description: fn.description,
        category: fn.category,
        examples: fn.examples.slice(0, 2) // Include fewer examples for context
      }));

      const prompt = `
You are an expert function router for a sales dashboard AI system.

User Query: "${userQuery}"

Available Functions:
${JSON.stringify(functionList, null, 2)}

Your task:
1. Find the best matching function for the user's query
2. Return the function name and a confidence score (0-1)
3. If no good match exists, return null

Return a JSON object with this format:
{
  "functionName": "exactFunctionName", 
  "confidence": 0.85,
  "reasoning": "brief explanation"
}

If no match found, return: {"functionName": null}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      try {
        const parsed = JSON.parse(response);
        
        if (parsed.functionName && parsed.confidence > 0.6) {
          const parameters = await this.extractParameters(userQuery, { functionName: parsed.functionName });
          
          return {
            functionName: parsed.functionName,
            confidence: parsed.confidence,
            parameters,
            reasoning: `AI fallback match: ${parsed.reasoning}`
          };
        }
      } catch (parseError) {
        console.error("❌ Failed to parse AI response:", parseError);
      }

      return null;

    } catch (error) {
      console.error("❌ AI fallback error:", error);
      return null;
    }
  }

  /**
   * Use AI to rank multiple matches and select the best one
   */
  private async rankMatches(userQuery: string, matches: any[]): Promise<any | null> {
    try {
      const prompt = `
You are ranking function matches for a user query.

User Query: "${userQuery}"

Potential Matches:
${matches.map((m, i) => `${i + 1}. ${m.functionName} - "${m.prompt}" (certainty: ${m._additional.certainty})`).join('\n')}

Select the BEST match by returning just the number (1, 2, 3, etc.) or "none" if no good match.
Consider:
- Semantic similarity to user intent
- Function relevance
- Vector certainty score

Return just the number:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      const selectedIndex = parseInt(response) - 1;
      
      if (selectedIndex >= 0 && selectedIndex < matches.length) {
        return matches[selectedIndex];
      }

      // Default to highest certainty if AI selection fails
      return matches.reduce((best, current) => 
        current._additional.certainty > best._additional.certainty ? current : best
      );

    } catch (error) {
      console.error("❌ Ranking error:", error);
      return matches[0]; // Return first match as fallback
    }
  }

  /**
   * Extract function parameters from user query using AI
   */
  private async extractParameters(userQuery: string, match: any): Promise<Record<string, any>> {
    try {
      const functionDef = getFunctionByName(match.functionName);
      
      if (!functionDef || functionDef.parameters.length === 0) {
        return {};
      }

      const prompt = `
Extract parameters for function "${match.functionName}" from user query: "${userQuery}"

Function parameters:
${functionDef.parameters.map(p => `- ${p.name} (${p.type}): ${p.description}${p.required ? ' [REQUIRED]' : ' [OPTIONAL]'}`).join('\n')}

Examples:
- "top 5 products" → {"limit": 5}
- "sales in January 2024" → {"startDate": "2024-01-01", "endDate": "2024-01-31"}
- "companies from USA" → {"country": "USA"}

Return only a JSON object with the extracted parameters. Use null for missing required parameters.
For dates, use YYYY-MM-DD format. For text, extract exactly as mentioned.

JSON:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();
      
      try {
        const extracted = JSON.parse(response);
        
        // Apply default values for missing optional parameters
        const finalParams = { ...extracted };
        for (const param of functionDef.parameters) {
          if (!(param.name in finalParams) && param.defaultValue !== undefined) {
            finalParams[param.name] = param.defaultValue;
          }
        }
        
        return finalParams;
        
      } catch (parseError) {
        console.error("❌ Failed to parse extracted parameters:", parseError);
        return {};
      }

    } catch (error) {
      console.error("❌ Parameter extraction error:", error);
      return {};
    }
  }

  /**
   * Execute the matched function with extracted parameters
   */
  private async executeFunction(match: FunctionMatch): Promise<any> {
    const functionDef = getFunctionByName(match.functionName);
    
    if (!functionDef) {
      throw new Error(`Function ${match.functionName} not found in registry`);
    }

    console.log(`🚀 Executing ${match.functionName} with parameters:`, match.parameters);

    // Convert parameters to array based on function definition order
    const args = functionDef.parameters.map(param => match.parameters[param.name]);
    
    // Execute the function
    const result = await functionDef.handler(...args);
    
    console.log(`✅ Function executed successfully`);
    return result;
  }

  /**
   * Generate a fallback response when no function matches
   */
  private async generateFallbackResponse(userQuery: string): Promise<string> {
    try {
      const availableCategories = [...new Set(FUNCTION_REGISTRY.map(f => f.category))];
      
      const prompt = `
The user asked: "${userQuery}"

I couldn't find a specific function to handle this query. Available data categories include: ${availableCategories.join(', ')}.

Generate a helpful response that:
1. Acknowledges I couldn't process their specific request
2. Suggests similar queries I can handle
3. Lists 2-3 example questions for each relevant category

Keep it friendly and concise.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
      
    } catch (error) {
      return `I'm sorry, I couldn't understand your request: "${userQuery}". Try asking about products, transactions, companies, categories, or admins. For example: "What are the top selling products?" or "Show me recent transactions."`;
    }
  }

  /**
   * Get available functions for a category (helper method)
   */
  async getAvailableFunctions(category?: string): Promise<FunctionDefinition[]> {
    if (category) {
      return FUNCTION_REGISTRY.filter(fn => fn.category === category);
    }
    return FUNCTION_REGISTRY;
  }
}

// Export singleton instance
export const promptRouter = new PromptRouter();
