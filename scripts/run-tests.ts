// Simple test runner for TypeScript test files
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔧 TypeScript Test Runner');
console.log('========================');

const testFiles = [
  'test-admins.ts',
  'test-transactions.ts'
];

async function runTestFile(filename: string) {
  console.log(`\n🏃 Running: ${filename}`);
  console.log('─'.repeat(50));
  
  try {
    // Import and run the test file
    await import(`./${filename}`);
  } catch (error) {
    console.error(`❌ Error running ${filename}:`, error);
  }
}

async function runAllTestFiles() {
  const testSelection = process.argv[2];
  
  if (testSelection) {
    // Run specific test file
    const testFile = testSelection.endsWith('.ts') ? testSelection : `${testSelection}.ts`;
    if (testFiles.includes(testFile)) {
      await runTestFile(testFile);
    } else {
      console.log(`❌ Test file not found: ${testFile}`);
      console.log(`Available tests: ${testFiles.join(', ')}`);
    }
  } else {
    // Run all test files
    for (const testFile of testFiles) {
      await runTestFile(testFile);
      console.log('\n' + '='.repeat(60));
    }
  }
}

runAllTestFiles().catch(console.error);
