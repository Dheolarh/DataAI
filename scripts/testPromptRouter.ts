// scripts/testPromptRouter.ts
import { aiService } from "../lib/aiService";
import { promptRouter } from "../lib/promptRouter";
import dotenv from "dotenv";
dotenv.config();

// Test queries covering different scenarios
const TEST_QUERIES = [
  // Product queries
  "What are the top selling products?",
  "Show me items that are out of stock",
  "Which products are running low?",
  "List all snacks",
  "What's the total value of our inventory?",
  "Products with high profit margins",
  
  // Transaction queries  
  "What are our total sales for January 2024?",
  "Show me recent transactions",
  "Sales in New York",
  "High value transactions over $5000",
  "Today's sales",
  "Weekly sales report",
  
  // Company queries
  "List all companies",
  "Companies from USA", 
  "Which suppliers have the most products?",
  
  // Category queries
  "Show me all categories",
  "How many products in each category?",
  
  // Admin queries
  "List all administrators",
  "Show me super admins",
  
  // Conversational queries
  "Hello",
  "Thank you",
  "What can you help me with?",
  
  // Edge cases
  "Random nonsense query xyz",
  "Show me the purple elephants",
];

async function runSingleTest(query: string): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Testing Query: "${query}"`);
  console.log(`${'='.repeat(80)}`);
  
  try {
    const startTime = Date.now();
    const response = await aiService.processQuery(query);
    const endTime = Date.now();
    
    console.log(`⏱️ Response Time: ${endTime - startTime}ms`);
    console.log(`📝 Type: ${response.type}`);
    
    if (response.functionUsed) {
      console.log(`🔧 Function: ${response.functionUsed}`);
      console.log(`💯 Confidence: ${(response.confidence! * 100).toFixed(1)}%`);
      console.log(`🧠 Reasoning: ${response.reasoning}`);
    }
    
    console.log(`\n📋 Response:`);
    console.log(response.content);
    
    if (response.data && response.type === 'data') {
      console.log(`\n📊 Raw Data Preview:`);
      if (Array.isArray(response.data)) {
        console.log(`Array with ${response.data.length} items`);
        if (response.data.length > 0) {
          console.log(`First item:`, JSON.stringify(response.data[0], null, 2));
        }
      } else {
        console.log(JSON.stringify(response.data, null, 2));
      }
    }
    
  } catch (error) {
    console.error(`❌ Test failed:`, error);
  }
}

async function runAllTests(): Promise<void> {
  console.log(`🚀 Starting Prompt Router Tests`);
  console.log(`📊 Testing ${TEST_QUERIES.length} queries...\n`);
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    await runSingleTest(TEST_QUERIES[i]);
    
    // Add small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ All tests completed!`);
}

async function testSpecificQuery(query: string): Promise<void> {
  if (query) {
    await runSingleTest(query);
  } else {
    console.log("Please provide a query to test.");
    console.log("Example: npm run test:prompt -- 'What are the top selling products?'");
  }
}

async function testFunctionRouter(): Promise<void> {
  console.log("🔧 Testing Function Router directly...\n");
  
  const testQueries = [
    "top selling products",
    "out of stock items", 
    "total sales January 2024",
    "companies from China"
  ];
  
  for (const query of testQueries) {
    console.log(`\n🔍 Direct Router Test: "${query}"`);
    
    try {
      const result = await promptRouter.routeAndExecute(query);
      console.log(`✅ Success: ${result.success}`);
      
      if (result.match) {
        console.log(`Function: ${result.match.functionName}`);
        console.log(`Parameters:`, result.match.parameters);
        console.log(`Confidence: ${(result.match.confidence * 100).toFixed(1)}%`);
      }
      
      if (result.result) {
        console.log(`Result type: ${Array.isArray(result.result) ? 'Array' : typeof result.result}`);
        if (Array.isArray(result.result)) {
          console.log(`Items: ${result.result.length}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Router test failed:`, error);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--single') && args[1]) {
    await testSpecificQuery(args[1]);
  } else if (args.includes('--router')) {
    await testFunctionRouter();
  } else if (args.includes('--help')) {
    console.log(`
🤖 Prompt Router Test Suite

Usage:
  npm run test:prompt              # Run all tests
  npm run test:prompt -- --single "query"   # Test specific query
  npm run test:prompt -- --router           # Test router only
  npm run test:prompt -- --help             # Show this help

Examples:
  npm run test:prompt -- --single "What are the top selling products?"
  npm run test:prompt -- --router
    `);
  } else {
    await runAllTests();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { runSingleTest, runAllTests, testFunctionRouter };
