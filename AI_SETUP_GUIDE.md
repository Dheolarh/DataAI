# 🤖 AI-Powered Prompt Router Setup Guide

This guide walks you through setting up the advanced AI prompt routing system
for your Sales Dashboard.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install tsx@^4.7.0
```

### 2. Set Up AI System

```bash
# Upload schema information and prompt patterns to Weaviate
npm run setup:ai
```

### 3. Test the System

```bash
# Test the full AI service
npm run test:prompt

# Test specific queries
npm run test:prompt -- --single "What are the top selling products?"

# Test the prompt router directly
npm run test:ai
```

## 🔧 Components Overview

### 1. Function Registry (`lib/functionRegistry.ts`)

- Central registry of all available database functions
- Maps natural language patterns to function calls
- Includes function metadata, parameters, and examples

### 2. Prompt Pattern System (`scripts/uploadPromptPatterns.ts`)

- Generates semantic embeddings for prompt patterns
- Stores patterns in Weaviate for vector search
- Creates variations and alternate phrasings automatically

### 3. Prompt Router (`lib/promptRouter.ts`)

- Core routing engine that maps user queries to functions
- Uses vector search + AI ranking for best matches
- Extracts function parameters from natural language
- Executes functions and formats responses

### 4. AI Service (`lib/aiService.ts`)

- High-level interface for processing user queries
- Handles intent classification (conversational vs data)
- Integrates all components into a unified service

### 5. Enhanced Chat Function (`supabase/functions/ai-chat/enhanced-index.ts`)

- Updated Supabase edge function with prompt routing
- Three-tier routing: conversational, function_call, sql_query
- Backward compatible with existing SQL generation

## 📊 Available Functions

The system includes comprehensive functions across these categories:

### Products

- `getTopSellingProducts` - Best sellers by quantity
- `listOutOfStockProducts` - Items with zero inventory
- `listLowStockProducts` - Items below threshold
- `getProductsByCategory` - Products in specific category
- `getTotalStockValue` - Total inventory value
- `getProductStockValue` - Value for specific product
- `getHighProfitMarginProducts` - Most profitable items

### Transactions

- `getTotalSales` - Revenue within date range
- `getRecentTransactions` - Latest transactions
- `getTransactionsByLocation` - Sales by location
- `getHighValueTransactions` - Large transactions
- `getTodaysTransactions` - Today's sales
- `getWeeklySalesReport` - Weekly summary
- `getMonthlySalesReport` - Monthly summary
- `getTopRevenueProducts` - Highest earning products

### Companies

- `getAllCompanies` - All suppliers
- `getCompaniesByCountry` - Suppliers by country
- `getTopCompaniesByProductCount` - Biggest suppliers

### Categories

- `getAllCategories` - All product categories
- `getCategoryProductCount` - Products per category
- `getTopCategoriesByProductCount` - Most popular categories

### Admins

- `getAllAdmins` - All admin users
- `getAdminsByRole` - Admins by role

## 🎯 Example Queries

### Natural Language → Function Mapping

| User Query                            | Mapped Function          | Parameters                                         |
| ------------------------------------- | ------------------------ | -------------------------------------------------- |
| "What are the top selling products?"  | `getTopSellingProducts`  | `{limit: 5}`                                       |
| "Show me items that are out of stock" | `listOutOfStockProducts` | `{}`                                               |
| "Sales in January 2024"               | `getTotalSales`          | `{startDate: "2024-01-01", endDate: "2024-01-31"}` |
| "Recent transactions"                 | `getRecentTransactions`  | `{limit: 10}`                                      |
| "Companies from USA"                  | `getCompaniesByCountry`  | `{country: "USA"}`                                 |

## 🔄 Architecture Flow

```
User Query → Intent Classification → Route Selection
    ↓
[Conversational] → ConversationalResponder → Natural Response
[Function Call] → Vector Search → Function Match → Execute → Format
[SQL Query] → Legacy SQL Engine → Custom Query → Execute → Format
```

## 🛠️ Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_api_key
```

### Weaviate Setup

The system uses Weaviate for vector storage of prompt patterns. Two classes are
created:

- `SchemaChunk` - Database schema information
- `PromptPattern` - Function prompt patterns with embeddings

## 🧪 Testing

### Full System Test

```bash
npm run test:prompt
```

Tests all query types: products, transactions, companies, categories, admins,
conversational, edge cases.

### Single Query Test

```bash
npm run test:prompt -- --single "your query here"
```

### Router Only Test

```bash
npm run test:ai
```

Tests the core prompt routing logic without full AI service.

## 🔧 Customization

### Adding New Functions

1. Add function to `scripts/db/` directory
2. Register in `lib/functionRegistry.ts` with examples
3. Run `npm run setup:ai` to update embeddings

### Modifying Prompt Patterns

1. Edit examples in function registry
2. Modify variation generation in `uploadPromptPatterns.ts`
3. Re-run setup to update Weaviate

### Adjusting AI Behavior

- Modify confidence thresholds in `promptRouter.ts`
- Adjust intent classification prompts
- Customize response formatting templates

## 🚨 Troubleshooting

### Common Issues

1. **Vector search returns no results**
   - Check Weaviate connection
   - Verify embeddings were uploaded
   - Lower confidence threshold

2. **Function not found**
   - Ensure function is registered in `functionRegistry.ts`
   - Check function name matches exactly
   - Verify function is exported from db scripts

3. **Parameter extraction fails**
   - Review parameter descriptions in registry
   - Check AI prompt for parameter extraction
   - Add more example patterns

4. **SQL execution errors**
   - Verify database schema matches function queries
   - Check RLS policies allow function execution
   - Review Supabase service key permissions

## 📈 Performance

### Optimization Tips

- Use vector search confidence thresholds (0.7+)
- Cache frequent function results
- Batch similar queries
- Monitor Weaviate response times
- Use connection pooling for database

### Monitoring

- Track function call success rates
- Monitor vector search performance
- Log parameter extraction accuracy
- Measure end-to-end response times

## 🔄 Deployment

### Supabase Edge Function

```bash
# Deploy enhanced chat function
supabase functions deploy ai-chat --no-verify-jwt
```

### Environment Setup

Ensure all environment variables are configured in:

- Local `.env` file
- Supabase project settings
- Weaviate cloud configuration

---

**Your AI-Powered Sales Dashboard is now ready! 🎉**

The system can understand natural language queries and automatically map them to
the right database functions, providing intelligent responses with proper data
formatting.
