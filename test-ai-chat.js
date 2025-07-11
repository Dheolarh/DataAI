#!/usr/bin/env node
// Test script for AI Chat System
// Usage: node test-ai-chat.js

const fetch = require('node-fetch');

// Configuration - Replace with your actual values
const SUPABASE_URL = 'https://your-project.supabase.co';
const ANON_KEY = 'your-anon-key';

const testQueries = [
    'What are our top selling products?',
    'Show me recent transactions',
    'What products are out of stock?',
    'Hello, how are you?',
    'What is our total sales this month?',
    'List all companies from USA'
];

async function testAIChat(message) {
    console.log(`\n🧪 Testing: "${message}"`);
    console.log('─'.repeat(50));

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
            },
            body: JSON.stringify({
                message: message,
                conversationId: 'test-' + Date.now()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('✅ Response received:');
        console.log('Type:', data.type);
        console.log('Content:', data.content);
        if (data.functionUsed) console.log('Function Used:', data.functionUsed);
        if (data.confidence) console.log('Confidence:', data.confidence + '%');
        if (data.reasoning) console.log('Reasoning:', data.reasoning);

        return data;

    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

async function runAllTests() {
    console.log('🚀 Starting AI Chat System Tests...');
    console.log('Configuration:');
    console.log('URL:', SUPABASE_URL);
    console.log('Key:', ANON_KEY.substring(0, 20) + '...');

    for (const query of testQueries) {
        await testAIChat(query);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    console.log('\n🎉 All tests completed!');
}

// Run if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = { testAIChat };
