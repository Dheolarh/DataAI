// lib/functionRegistry.ts
import * as productFunctions from '../scripts/db/products';
import * as transactionFunctions from '../scripts/db/transactions';
import * as companyFunctions from '../scripts/db/companies';
import * as categoryFunctions from '../scripts/db/categories';
import * as adminFunctions from '../scripts/db/admins';

export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: string | number | boolean;
  }>;
  examples: string[];
  category: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => Promise<any>;
}

export const FUNCTION_REGISTRY: FunctionDefinition[] = [
  // === PRODUCT FUNCTIONS ===
  {
    name: "getTopSellingProducts",
    description: "Get the best-selling products ranked by total quantity sold",
    parameters: [
      { name: "limit", type: "number", required: false, description: "Number of products to return", defaultValue: 5 }
    ],
    examples: [
      "What are the top selling products?",
      "Show me the best sellers",
      "Which products sold the most?",
      "Top 10 best selling items"
    ],
    category: "products",
    handler: productFunctions.getTopSellingProducts
  },
  {
    name: "listOutOfStockProducts", 
    description: "Find all products that are completely out of stock (stock = 0)",
    parameters: [],
    examples: [
      "What products are out of stock?",
      "Show me items with no inventory",
      "Which products are finished?",
      "List all empty stock items"
    ],
    category: "products",
    handler: productFunctions.listOutOfStockProducts
  },
  {
    name: "listLowStockProducts",
    description: "Find products below a certain stock threshold",
    parameters: [
      { name: "threshold", type: "number", required: false, description: "Stock level threshold", defaultValue: 10 }
    ],
    examples: [
      "What products are running low?",
      "Show me low stock items",
      "Which products need restocking?",
      "Products below 5 units"
    ],
    category: "products", 
    handler: productFunctions.listLowStockProducts
  },
  {
    name: "getProductsByCategory",
    description: "Get all products in a specific category",
    parameters: [
      { name: "categoryName", type: "string", required: true, description: "Name of the category to filter by" }
    ],
    examples: [
      "Show me all snacks",
      "List products in Electronics category",
      "What beverages do we have?",
      "All items in Food category"
    ],
    category: "products",
    handler: productFunctions.listProductsByCategoryName
  },
  {
    name: "getTotalStockValue",
    description: "Calculate the total value of all inventory",
    parameters: [],
    examples: [
      "What's the total stock value?",
      "How much is our inventory worth?",
      "Total value of all products",
      "Sum of inventory value"
    ],
    category: "products",
    handler: productFunctions.getTotalStockValue
  },
  {
    name: "getProductStockValue", 
    description: "Get the stock value for a specific product",
    parameters: [
      { name: "productId", type: "string", required: true, description: "ID of the product" }
    ],
    examples: [
      "What's the stock value of Galaxy S24?",
      "Value of iPhone inventory",
      "How much is our Coke stock worth?"
    ],
    category: "products",
    handler: productFunctions.getProductStockValue
  },
  {
    name: "getProfitabilityReport",
    description: "Get products with their profit margins and profitability data",
    parameters: [],
    examples: [
      "Which products have the highest profit margins?",
      "Show me most profitable items",
      "Products with high profitability",
      "Profitability report"
    ],
    category: "products",
    handler: productFunctions.getProfitabilityReport
  },

  // === TRANSACTION FUNCTIONS ===
  {
    name: "getTotalSales",
    description: "Get total sales revenue within a date range",
    parameters: [
      { name: "startDate", type: "string", required: false, description: "Start date (YYYY-MM-DD format)" },
      { name: "endDate", type: "string", required: false, description: "End date (YYYY-MM-DD format)" }
    ],
    examples: [
      "What are total sales for January 2024?",
      "Sales revenue this month",
      "Total sales between Jan 1 and Jan 31",
      "How much did we sell last week?"
    ],
    category: "transactions",
    handler: transactionFunctions.getTotalSales
  },
  {
    name: "getRecentTransactions",
    description: "Get the most recent transactions",
    parameters: [
      { name: "limit", type: "number", required: false, description: "Number of transactions to return", defaultValue: 10 }
    ],
    examples: [
      "Show me recent transactions",
      "Latest sales",
      "Last 20 transactions",
      "Recent purchases"
    ],
    category: "transactions", 
    handler: transactionFunctions.getRecentTransactions
  },
  {
    name: "getTransactionsByLocation",
    description: "Get all transactions from a specific location",
    parameters: [
      { name: "location", type: "string", required: true, description: "Location name or city" }
    ],
    examples: [
      "Sales in New York",
      "Transactions from London",
      "What sold in Lagos?",
      "All sales in California"
    ],
    category: "transactions",
    handler: transactionFunctions.getTransactionsByLocation
  },
  {
    name: "getHighValueTransactions", 
    description: "Find transactions above a certain amount",
    parameters: [
      { name: "minAmount", type: "number", required: false, description: "Minimum transaction amount", defaultValue: 1000 }
    ],
    examples: [
      "Show me high value transactions",
      "Transactions over $5000",
      "Big sales",
      "Large purchases above $2000"
    ],
    category: "transactions",
    handler: transactionFunctions.getHighValueTransactions
  },
  {
    name: "getTodaysTransactions",
    description: "Get all transactions from today",
    parameters: [],
    examples: [
      "Today's sales",
      "What sold today?",
      "Transactions today",
      "Today's revenue"
    ],
    category: "transactions",
    handler: transactionFunctions.getTodaysTransactions
  },
  {
    name: "getWeeklySalesReport",
    description: "Get a comprehensive weekly sales report",
    parameters: [],
    examples: [
      "Weekly sales report",
      "This week's performance", 
      "Sales summary for the week",
      "Weekly revenue breakdown"
    ],
    category: "transactions",
    handler: transactionFunctions.getWeeklySalesReport
  },
  {
    name: "getMonthlySalesReport",
    description: "Get a comprehensive monthly sales report", 
    parameters: [],
    examples: [
      "Monthly sales report",
      "This month's performance",
      "Sales summary for the month",
      "Monthly revenue breakdown"
    ],
    category: "transactions",
    handler: transactionFunctions.getMonthlySalesReport
  },
  {
    name: "getTopRevenueProducts",
    description: "Get products that generated the most revenue",
    parameters: [
      { name: "limit", type: "number", required: false, description: "Number of products to return", defaultValue: 10 },
      { name: "days", type: "number", required: false, description: "Number of days to look back" }
    ],
    examples: [
      "Which products made the most money?",
      "Top revenue generating items",
      "Highest earning products",
      "Most profitable products by revenue"
    ],
    category: "transactions",
    handler: transactionFunctions.getTopRevenueProducts
  },

  // === COMPANY FUNCTIONS ===
  {
    name: "getAllCompanies",
    description: "Get a list of all companies in the system",
    parameters: [],
    examples: [
      "List all companies",
      "Show me all suppliers",
      "What companies do we work with?",
      "All business partners"
    ],
    category: "companies",
    handler: companyFunctions.getAllCompanies
  },
  {
    name: "getCompaniesByCountry",
    description: "Get companies from a specific country",
    parameters: [
      { name: "country", type: "string", required: true, description: "Country name" }
    ],
    examples: [
      "Companies from USA",
      "Suppliers in China", 
      "German companies",
      "All partners from Nigeria"
    ],
    category: "companies",
    handler: companyFunctions.getCompaniesByCountry
  },
  {
    name: "getTopCompaniesByProductCount",
    description: "Get companies with the most products",
    parameters: [
      { name: "limit", type: "number", required: false, description: "Number of companies to return", defaultValue: 10 }
    ],
    examples: [
      "Which companies supply the most products?",
      "Top suppliers by product count",
      "Companies with most items",
      "Biggest product suppliers"
    ],
    category: "companies", 
    handler: companyFunctions.getTopCompaniesByProductCount
  },

  // === CATEGORY FUNCTIONS ===
  {
    name: "getAllCategories",
    description: "Get all product categories",
    parameters: [],
    examples: [
      "List all categories",
      "What product categories exist?",
      "Show me all product types",
      "All categories"
    ],
    category: "categories",
    handler: categoryFunctions.getAllCategories
  },
  {
    name: "getCategoryProductCount",
    description: "Get the number of products in each category",
    parameters: [],
    examples: [
      "How many products are in each category?",
      "Product count by category",
      "Category distribution",
      "Products per category"
    ],
    category: "categories",
    handler: categoryFunctions.getCategoryProductCount
  },
  {
    name: "getTopCategoriesByProductCount",
    description: "Get categories with the most products",
    parameters: [
      { name: "limit", type: "number", required: false, description: "Number of categories to return", defaultValue: 10 }
    ],
    examples: [
      "Which categories have the most products?",
      "Top categories by product count",
      "Most popular categories",
      "Categories with most items"
    ],
    category: "categories",
    handler: categoryFunctions.getTopCategoriesByProductCount
  },

  // === ADMIN FUNCTIONS ===
  {
    name: "getAllAdmins",
    description: "Get all admin users in the system",
    parameters: [],
    examples: [
      "List all admins",
      "Show me all administrators",
      "Who are the admins?",
      "All admin users"
    ],
    category: "admins",
    handler: adminFunctions.getAllAdmins
  },
  {
    name: "getAdminsByRole",
    description: "Get admins by their role",
    parameters: [
      { name: "role", type: "string", required: true, description: "Admin role (super_admin, admin, etc.)" }
    ],
    examples: [
      "Show me super admins",
      "List all managers",
      "Who are the moderators?",
      "Admins with super_admin role"
    ],
    category: "admins",
    handler: adminFunctions.getAdminsByRole
  }
];

// Helper function to find function by name
export function getFunctionByName(name: string): FunctionDefinition | undefined {
  return FUNCTION_REGISTRY.find(fn => fn.name === name);
}

// Helper function to get functions by category
export function getFunctionsByCategory(category: string): FunctionDefinition[] {
  return FUNCTION_REGISTRY.filter(fn => fn.category === category);
}

// Helper function to search functions by keyword
export function searchFunctions(keyword: string): FunctionDefinition[] {
  const lowerKeyword = keyword.toLowerCase();
  return FUNCTION_REGISTRY.filter(fn => 
    fn.name.toLowerCase().includes(lowerKeyword) ||
    fn.description.toLowerCase().includes(lowerKeyword) ||
    fn.examples.some(example => example.toLowerCase().includes(lowerKeyword))
  );
}
