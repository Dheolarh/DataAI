import weaviate from "weaviate-ts-client";
import { generateEmbedding } from "./embed";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import dotenv from "dotenv";
dotenv.config();

const weaviateClient = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_URL!.replace(/^https?:\/\//, ""),
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-pro",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.4,
});

export async function askGemini(userQuestion: string): Promise<string> {
  const userVector = await generateEmbedding(userQuestion);

  const response = await weaviateClient.graphql
    .get()
    .withClassName("SchemaChunk")
    .withFields("content title _additional {certainty}")
    .withNearVector({ vector: userVector, certainty: 0.65 })
    .withLimit(3)
    .do();

  const results = response.data.Get.SchemaChunk || [];
  const context = results.map((r: any) => r.content).join("\n---\n");

  const prompt = `
You are a helpful AI analyst for a sales dashboard. A user has asked:
"${userQuestion}"

Below is context about the database:
${context || "No relevant schema found"}

Explain or answer their question clearly. If you don't know, say you don't know.
`;

  const output = await llm.invoke(prompt);
  if (typeof output.content === "string") {
    return output.content;
  }

  return "⚠️ No valid response from Gemini.";
}
