#!/usr/bin/env deno run -A

// Test script for ai-chat function
// Run with: deno run -A test-ai-chat.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

async function testAIChat() {
  console.log('🧪 Testing AI Chat Function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        message: 'Hello, what are our top selling products?',
        conversationId: 'test-conversation'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Response:', data);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (import.meta.main) {
  testAIChat();
}
