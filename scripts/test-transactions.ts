// Test script for transactions.ts functions (READ-ONLY OPERATIONS)
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from parent directory
config({ path: join(process.cwd(), '..', '.env') });

// Import all transaction functions
import {
  // Basic functions
  getAllTransactions,
  getTransactionById,
  getTransactionsByDateRange,
  getTransactionsByProduct,
  getTransactionsByLocation,
  getRecentTransactions,
  
  // Analytics functions
  getDailySales,
  getWeeklySales,
  getMonthlySales,
  getSalesTrends,
  getTopSellingProducts,
  getLocationAnalysis,
  getTransactionVelocity,
  getSalesFrequency,
  getPeakSalesHours,
  getCustomerSegmentAnalysis,
  
  // Search and filter functions
  searchTransactions,
  advancedTransactionSearch,
  getTransactionsByAmountRange,
  getTransactionsByQuantityRange,
  getHighValueTransactions,
  getLowQuantityTransactions,
  
  // Comprehensive analysis
  getComprehensiveTransactionAnalysis,
  getTransactionDashboardStats
} from './db/transactions.js';

// Test configuration
const TEST_CONFIG = {
  createTestData: false, // Disabled since we can't create test data (read-only)
  cleanupAfterTests: false, // Disabled since we can't delete data (read-only)
  testTransactionData: {
    product_id: 'test-product-123',
    product_name: 'Test Product',
    quantity: 2,
    unit_price: 25.99,
    total_amount: 51.98,
    location: 'Test Store',
    transaction_date: new Date().toISOString()
  }
};

let createdTestTransactionIds: string[] = [];

async function runTest(testName: string, testFunction: () => Promise<void>) {
  try {
    console.log(`\n🧪 Running test: ${testName}`);
    await testFunction();
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    console.error(`❌ ${testName} - FAILED:`, error);
  }
}

async function setupTestData() {
  if (!TEST_CONFIG.createTestData) {
    console.log('ℹ️ Test data creation disabled (read-only mode)');
    return;
  }
  
  console.log('\n🔧 Setting up test data...');
  console.log('ℹ️ Test data creation skipped - transactions table is read-only');
}

async function cleanupTestData() {
  if (!TEST_CONFIG.cleanupAfterTests || createdTestTransactionIds.length === 0) return;
  
  console.log('\n🧹 Cleaning up test data...');
  console.log('ℹ️ Cleanup skipped - transactions table is read-only');
}

// ===== BASIC FUNCTION TESTS =====

async function testGetAllTransactions() {
  const transactions = await getAllTransactions();
  console.log(`📊 Total transactions found: ${transactions.length}`);
  if (transactions.length > 0) {
    const sample = transactions[0] as any;
    console.log(`   Sample transaction: ${sample.product_name} - $${sample.total_amount}`);
    console.log(`   Product: ${sample.product_name} (${sample.product_sku})`);
    console.log(`   Quantity: ${sample.quantity} @ $${sample.unit_price} each`);
    console.log(`   Location: ${sample.location}`);
    console.log(`   Time: ${sample.formatted_datetime}`);
  }
}

async function testGetRecentTransactions() {
  const recentTransactions = await getRecentTransactions(5);
  console.log(`📊 Recent transactions (last 5): ${recentTransactions.length}`);
  if (recentTransactions.length > 0) {
    console.log('   Sample recent transaction:');
    const sample = recentTransactions[0] as any;
    console.log(`     Product: ${sample.product_name} (${sample.product_sku})`);
    console.log(`     Quantity: ${sample.quantity} @ $${sample.unit_price} each`);
    console.log(`     Total: $${sample.total_amount}`);
    console.log(`     Location: ${sample.location}`);
    console.log(`     Time: ${sample.formatted_datetime}`);
    console.log(`     ${sample.minutes_ago} minutes ago`);
  }
}

async function testGetTransactionsByDateRange() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
  
  const transactions = await getTransactionsByDateRange(
    startDate.toISOString(),
    endDate.toISOString()
  );
  console.log(`📊 Transactions in last 7 days: ${transactions.length}`);
  if (transactions.length > 0) {
    console.log('   Sample transaction:');
    const sample = transactions[0] as any;
    console.log(`     Product: ${sample.product_name} (${sample.product_sku})`);
    console.log(`     Quantity: ${sample.quantity} @ $${sample.unit_price} each`);
    console.log(`     Total: $${sample.total_amount}`);
    console.log(`     Location: ${sample.location}`);
    console.log(`     Time: ${sample.formatted_datetime}`);
    console.log(`     ${sample.days_ago} days ago`);
  }
}

async function testGetTransactionsByProduct() {
  // First get a product ID from existing transactions
  const allTransactions = await getAllTransactions();
  if (allTransactions.length > 0) {
    const sample = allTransactions[0] as any;
    const productId = sample.product_id;
    const productTransactions = await getTransactionsByProduct(productId as string);
    console.log(`📊 Transactions for product ${productId}: ${productTransactions.length}`);
    if (productTransactions.length > 0) {
      console.log('   Sample product transaction:');
      const productSample = productTransactions[0] as any;
      console.log(`     Product: ${productSample.product_name} (${productSample.product_sku})`);
      console.log(`     Quantity: ${productSample.quantity} @ $${productSample.unit_price} each`);
      console.log(`     Total: $${productSample.total_amount}`);
      console.log(`     Location: ${productSample.location}`);
      console.log(`     Time: ${productSample.formatted_datetime}`);
    }
  } else {
    console.log('📊 No transactions found to test product filtering');
  }
}

async function testGetTransactionsByLocation() {
  // First get a location from existing transactions
  const allTransactions = await getAllTransactions();
  if (allTransactions.length > 0) {
    const sample = allTransactions[0] as any;
    const location = sample.location;
    const locationTransactions = await getTransactionsByLocation(location as string);
    console.log(`📊 Transactions for location "${location}": ${locationTransactions.length}`);
    if (locationTransactions.length > 0) {
      console.log('   Sample location transaction:');
      const locationSample = locationTransactions[0] as any;
      console.log(`     Product: ${locationSample.product_name} (${locationSample.product_sku})`);
      console.log(`     Quantity: ${locationSample.quantity} @ $${locationSample.unit_price} each`);
      console.log(`     Total: $${locationSample.total_amount}`);
      console.log(`     Location: ${locationSample.location}`);
      console.log(`     Time: ${locationSample.formatted_datetime}`);
    }
  } else {
    console.log('📊 No transactions found to test location filtering');
  }
}

// ===== ANALYTICS FUNCTION TESTS =====

async function testGetDailySales() {
  const dailySales = await getDailySales(7);
  console.log(`📊 Daily sales (last 7 days): ${dailySales.length} entries`);
  if (dailySales.length > 0) {
    const totalSales = dailySales.reduce((sum, day) => sum + (day.total_sales || 0), 0);
    console.log(`   Total sales: $${totalSales.toFixed(2)}`);
  }
}

async function testGetWeeklySales() {
  const weeklySales = await getWeeklySales(4);
  console.log(`📊 Weekly sales (last 4 weeks): ${weeklySales.length} entries`);
}

async function testGetMonthlySales() {
  const monthlySales = await getMonthlySales(6);
  console.log(`📊 Monthly sales (last 6 months): ${monthlySales.length} entries`);
}

async function testGetSalesTrends() {
  const trends = await getSalesTrends(30);
  console.log(`📊 Sales trends (last 30 days):`);
  console.log(`   Growth rate: ${trends.growth_rate?.toFixed(2)}%`);
  console.log(`   Average daily sales: $${trends.average_daily_sales?.toFixed(2)}`);
  console.log(`   Peak day: ${trends.peak_day?.date} ($${trends.peak_day?.sales?.toFixed(2)})`);
}

async function testGetTopSellingProducts() {
  const topProducts = await getTopSellingProducts(5);
  console.log(`📊 Top selling products (top 5): ${topProducts.length} products`);
  topProducts.forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.product_name}: ${product.total_quantity} units, $${product.total_revenue?.toFixed(2)}`);
  });
}

async function testGetLocationAnalysis() {
  const locationAnalysis = await getLocationAnalysis();
  console.log(`📊 Location analysis: ${locationAnalysis.length} locations`);
  locationAnalysis.forEach(location => {
    console.log(`   ${location.location}: ${location.transaction_count} transactions, $${location.total_revenue?.toFixed(2)}`);
  });
}

async function testGetTransactionVelocity() {
  const velocity = await getTransactionVelocity();
  console.log(`📊 Transaction velocity:`);
  console.log(`   Today: ${velocity.today} transactions`);
  console.log(`   This week: ${velocity.this_week} transactions`);
  console.log(`   This month: ${velocity.this_month} transactions`);
  console.log(`   Daily average: ${velocity.daily_average?.toFixed(2)}`);
}

async function testGetSalesFrequency() {
  const frequency = await getSalesFrequency();
  console.log(`📊 Sales frequency:`);
  console.log(`   High frequency products: ${frequency.high_frequency?.length || 0}`);
  console.log(`   Medium frequency products: ${frequency.medium_frequency?.length || 0}`);
  console.log(`   Low frequency products: ${frequency.low_frequency?.length || 0}`);
}

async function testGetPeakSalesHours() {
  const peakHours = await getPeakSalesHours();
  console.log(`📊 Peak sales hours: ${peakHours.length} hour periods`);
  if (peakHours.length > 0) {
    console.log(`   Peak hour: ${peakHours[0].hour}:00 (${peakHours[0].transaction_count} transactions)`);
  }
}

async function testGetCustomerSegmentAnalysis() {
  const segments = await getCustomerSegmentAnalysis();
  console.log(`📊 Customer segment analysis:`);
  console.log(`   High value customers: ${segments.high_value_customers?.count || 0}`);
  console.log(`   Medium value customers: ${segments.medium_value_customers?.count || 0}`);
  console.log(`   Low value customers: ${segments.low_value_customers?.count || 0}`);
}

// ===== SEARCH FUNCTION TESTS =====

async function testSearchTransactions() {
  const searchResults = await searchTransactions('Test');
  console.log(`📊 Search results for 'Test': ${searchResults.length} matches`);
}

async function testAdvancedTransactionSearch() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  
  const searchResults = await advancedTransactionSearch({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    minAmount: 10,
    limit: 10
  });
  console.log(`📊 Advanced search (last 30 days, min $10, limit 10): ${searchResults.length} results`);
}

async function testGetTransactionsByAmountRange() {
  const amountRangeTransactions = await getTransactionsByAmountRange(20, 100);
  console.log(`📊 Transactions between $20-$100: ${amountRangeTransactions.length}`);
}

async function testGetHighValueTransactions() {
  const highValueTransactions = await getHighValueTransactions(50);
  console.log(`📊 High value transactions (>$50): ${highValueTransactions.length}`);
}

// ===== MANAGEMENT FUNCTION TESTS =====

async function testAddAndUpdateTransaction() {
  console.log('📊 Add/Update test skipped - transactions table is read-only');
  console.log('ℹ️ Write operations (CREATE, UPDATE, DELETE) are not allowed on transactions table');
}

// ===== COMPREHENSIVE ANALYSIS TESTS =====

async function testGetComprehensiveTransactionAnalysis() {
  const analysis = await getComprehensiveTransactionAnalysis();
  console.log('📊 Comprehensive Transaction Analysis:');
  console.log(`   Total transactions: ${analysis.summary?.transaction_count || 0}`);
  console.log(`   Total revenue: $${analysis.summary?.total_revenue?.toFixed(2) || 0}`);
  console.log(`   Average transaction value: $${analysis.summary?.average_transaction_value?.toFixed(2) || 0}`);
  console.log(`   Total products sold: ${analysis.summary?.total_quantity || 0}`);
  console.log(`   Unique products: ${analysis.summary?.unique_products_sold || 0}`);
  console.log(`   Active locations: ${analysis.summary?.unique_locations_served || 0}`);
}

async function testGetTransactionDashboardStats() {
  const dashboardStats = await getTransactionDashboardStats();
  console.log('📊 Transaction Dashboard Stats:');
  console.log(`   Today's sales: $${dashboardStats.quick_stats?.today_sales?.toFixed(2) || 0}`);
  console.log(`   This week's sales: $${dashboardStats.quick_stats?.week_sales?.toFixed(2) || 0}`);
  console.log(`   This month's sales: $${dashboardStats.quick_stats?.month_sales?.toFixed(2) || 0}`);
  console.log(`   Growth rate: ${dashboardStats.quick_stats?.growth_rate?.toFixed(2) || 0}%`);
}

// ===== MAIN TEST RUNNER =====

async function runAllTests() {
  console.log('🚀 Starting Transaction Functions Test Suite');
  console.log('==========================================');
  
  // Setup
  await setupTestData();
  
  // Basic function tests
  console.log('\n📋 BASIC FUNCTION TESTS');
  await runTest('Get All Transactions', testGetAllTransactions);
  await runTest('Get Recent Transactions', testGetRecentTransactions);
  await runTest('Get Transactions by Date Range', testGetTransactionsByDateRange);
  await runTest('Get Transactions by Product', testGetTransactionsByProduct);
  await runTest('Get Transactions by Location', testGetTransactionsByLocation);
  
  // Analytics function tests
  console.log('\n📊 ANALYTICS FUNCTION TESTS');
  await runTest('Get Daily Sales', testGetDailySales);
  await runTest('Get Weekly Sales', testGetWeeklySales);
  await runTest('Get Monthly Sales', testGetMonthlySales);
  await runTest('Get Sales Trends', testGetSalesTrends);
  await runTest('Get Top Selling Products', testGetTopSellingProducts);
  await runTest('Get Location Analysis', testGetLocationAnalysis);
  await runTest('Get Transaction Velocity', testGetTransactionVelocity);
  await runTest('Get Sales Frequency', testGetSalesFrequency);
  await runTest('Get Peak Sales Hours', testGetPeakSalesHours);
  await runTest('Get Customer Segment Analysis', testGetCustomerSegmentAnalysis);
  
  // Search function tests
  console.log('\n🔍 SEARCH FUNCTION TESTS');
  await runTest('Search Transactions', testSearchTransactions);
  await runTest('Advanced Transaction Search', testAdvancedTransactionSearch);
  await runTest('Get Transactions by Amount Range', testGetTransactionsByAmountRange);
  await runTest('Get High Value Transactions', testGetHighValueTransactions);
  
  // Management function tests (DISABLED - READ-ONLY)
  console.log('\n⚙️ MANAGEMENT FUNCTION TESTS (READ-ONLY MODE)');
  await runTest('Add and Update Transaction (Read-Only)', testAddAndUpdateTransaction);
  
  // Comprehensive analysis tests
  console.log('\n📈 COMPREHENSIVE ANALYSIS TESTS');
  await runTest('Get Comprehensive Transaction Analysis', testGetComprehensiveTransactionAnalysis);
  await runTest('Get Transaction Dashboard Stats', testGetTransactionDashboardStats);
  
  // Cleanup
  await cleanupTestData();
  
  console.log('\n🏁 Transaction Functions Test Suite Complete!');
  console.log('==========================================');
}

// Run the tests
runAllTests().catch(console.error);
