# 🚀 Quick Deployment Guide

## Current Status

✅ All TypeScript errors fixed\
✅ Enhanced AI system created\
✅ Function registry established\
✅ Prompt routing system ready

## Next Steps

### 1. Install Dependencies

```bash
npm install tsx@^4.7.0
```

### 2. Set Up AI System (Optional - Enhanced Features)

```bash
# This sets up the advanced prompt routing with Weaviate
npm run setup:ai
```

### 3. Deploy Current AI Function

```bash
# Deploy the current working AI chat function
supabase functions deploy ai-chat --no-verify-jwt
```

### 4. Test the System

```bash
# Test the enhanced prompt router (requires Weaviate setup)
npm run test:prompt

# Or test a specific query
npm run test:prompt -- --single "What are the top selling products?"
```

## 🔄 Migration Path

You now have two AI chat functions:

### Current Working Version (`index.ts`)

- ✅ Fixed TypeScript errors
- ✅ Intent classification (conversational vs data_query)
- ✅ Dynamic SQL generation
- ✅ Ready for immediate deployment
- Uses: Gemini AI + Dynamic SQL

### Enhanced Version (`enhanced-index.ts`)

- ✅ Advanced prompt routing
- ✅ Function-to-query mapping
- ✅ Vector search with Weaviate
- ✅ Three-tier routing (conversational, function_call, sql_query)
- Uses: Gemini AI + Weaviate + Function Registry

## 🔧 Switching to Enhanced Version

When ready to upgrade to the enhanced system:

1. **Backup current function:**
   ```bash
   cp supabase/functions/ai-chat/index.ts supabase/functions/ai-chat/index.backup.ts
   ```

2. **Replace with enhanced version:**
   ```bash
   cp supabase/functions/ai-chat/enhanced-index.ts supabase/functions/ai-chat/index.ts
   ```

3. **Deploy enhanced version:**
   ```bash
   supabase functions deploy ai-chat --no-verify-jwt
   ```

## 🧪 Testing Your Current System

Test your fixed AI chat function with these example queries:

### Data Queries

- "What are the top selling products?"
- "Show me recent transactions"
- "List all companies"
- "Sales for last month"
- "Who logged in today?"

### Conversational

- "Hello"
- "Thank you"
- "What can you help me with?"

## 📊 System Capabilities

### Current System (index.ts)

- ✅ Natural language to SQL conversion
- ✅ Intent classification
- ✅ Dynamic schema awareness
- ✅ Error handling and validation
- ✅ Proper TypeScript types

### Enhanced System (enhanced-index.ts)

- ✅ All current features +
- ✅ Pre-built function library
- ✅ Vector search for query matching
- ✅ Parameter extraction from natural language
- ✅ Structured response formatting
- ✅ Fallback to SQL for complex queries

## 🔍 Monitoring

Check function logs:

```bash
supabase functions logs ai-chat
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Environment variables not set**
   - Check GEMINI_API_KEY in Supabase project settings

2. **SQL generation errors**
   - Verify get_schema_info RPC function exists
   - Check execute_sql RPC function exists

3. **Enhanced features not working**
   - Ensure Weaviate credentials are configured
   - Run `npm run setup:ai` to initialize embeddings

---

**Your AI-powered sales dashboard is now error-free and ready to deploy! 🎉**
