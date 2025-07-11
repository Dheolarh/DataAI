// scripts/uploadPromptPatterns.ts
import weaviate from "weaviate-ts-client";
import { generateEmbedding } from "../lib/embed";
import { FUNCTION_REGISTRY } from "../lib/functionRegistry";
import dotenv from "dotenv";
dotenv.config();

// Initialize Weaviate client
const client = weaviate.client({
  scheme: "https", 
  host: process.env.WEAVIATE_URL!.replace(/^https?:\/\//, ""),
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
});

interface PromptPattern {
  prompt: string;
  functionName: string;
  description: string;
  category: string;
  parameters?: string;
  confidence: number;
}

async function createPromptPatternClass() {
  // Delete existing class if it exists
  try {
    await client.schema.classDeleter().withClassName("PromptPattern").do();
    console.log("🗑️ Deleted existing PromptPattern class");
  } catch (error) {
    // Class doesn't exist, continue
  }

  // Create new class
  await client.schema
    .classCreator()
    .withClass({
      class: "PromptPattern",
      vectorizer: "none",
      properties: [
        { name: "prompt", dataType: ["text"] },
        { name: "functionName", dataType: ["text"] },
        { name: "description", dataType: ["text"] },
        { name: "category", dataType: ["text"] },
        { name: "parameters", dataType: ["text"] },
        { name: "confidence", dataType: ["number"] },
      ],
    })
    .do();
  
  console.log("✅ Created PromptPattern class");
}

async function generatePromptPatterns(): Promise<PromptPattern[]> {
  const patterns: PromptPattern[] = [];

  for (const func of FUNCTION_REGISTRY) {
    // Add each example as a separate pattern
    for (const example of func.examples) {
      patterns.push({
        prompt: example,
        functionName: func.name,
        description: func.description,
        category: func.category,
        parameters: JSON.stringify(func.parameters),
        confidence: 1.0
      });
    }

    // Add additional variations based on function description
    const variations = generateVariations(func);
    patterns.push(...variations);
  }

  return patterns;
}

function generateVariations(func: any): PromptPattern[] {
  const variations: PromptPattern[] = [];
  
  // Generate variations based on function type
  if (func.name.includes('getTop')) {
    variations.push({
      prompt: `show me the best ${func.category}`,
      functionName: func.name,
      description: func.description, 
      category: func.category,
      parameters: JSON.stringify(func.parameters),
      confidence: 0.9
    });
  }

  if (func.name.includes('getAll')) {
    variations.push({
      prompt: `list everything in ${func.category}`,
      functionName: func.name,
      description: func.description,
      category: func.category, 
      parameters: JSON.stringify(func.parameters),
      confidence: 0.9
    });
  }

  if (func.name.includes('Total')) {
    variations.push({
      prompt: `what is the sum of ${func.category}`,
      functionName: func.name,
      description: func.description,
      category: func.category,
      parameters: JSON.stringify(func.parameters),
      confidence: 0.8
    });
  }

  if (func.name.includes('Report')) {
    variations.push({
      prompt: `give me a summary of ${func.category}`,
      functionName: func.name,
      description: func.description,
      category: func.category,
      parameters: JSON.stringify(func.parameters),
      confidence: 0.8
    });
  }

  if (func.name.includes('Low') || func.name.includes('OutOf')) {
    variations.push({
      prompt: `what needs attention in ${func.category}`,
      functionName: func.name,
      description: func.description,
      category: func.category,
      parameters: JSON.stringify(func.parameters),
      confidence: 0.7
    });
  }

  return variations;
}

async function uploadPromptPatterns() {
  console.log("🔍 Generating prompt patterns...");
  const patterns = await generatePromptPatterns();
  console.log(`📝 Generated ${patterns.length} prompt patterns`);

  console.log("🚀 Uploading patterns to Weaviate...");
  let uploadCount = 0;

  for (const pattern of patterns) {
    try {
      const vector = await generateEmbedding(pattern.prompt);
      
      await client.data
        .creator()
        .withClassName("PromptPattern")
        .withProperties({
          prompt: pattern.prompt,
          functionName: pattern.functionName,
          description: pattern.description,
          category: pattern.category,
          parameters: pattern.parameters,
          confidence: pattern.confidence,
        })
        .withVector(vector)
        .do();
      
      uploadCount++;
      if (uploadCount % 10 === 0) {
        console.log(`✅ Uploaded ${uploadCount}/${patterns.length} patterns`);
      }
    } catch (error) {
      console.error(`❌ Failed to upload pattern: ${pattern.prompt}`, error);
    }
  }

  console.log(`🎉 Successfully uploaded ${uploadCount} prompt patterns!`);
}

async function main() {
  try {
    console.log("🔧 Setting up prompt pattern embedding system...");
    await createPromptPatternClass();
    await uploadPromptPatterns();
    console.log("✨ Prompt pattern system ready!");
  } catch (error) {
    console.error("💥 Error setting up prompt patterns:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { generatePromptPatterns, uploadPromptPatterns };
