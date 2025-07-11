import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as errorFunctions from './db/errors';

// Get the current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testErrorLogFunctions() {
  console.log('🧪 Starting Error Log Functions Test Suite\n');

  try {
    // Test 1: Get all error logs
    console.log('📋 Test 1: Getting all error logs...');
    const allErrors = await errorFunctions.getAllErrorLogs();
    console.log(`✅ Found ${allErrors.length} total error logs`);
    if (allErrors.length > 0) {
      const firstError = allErrors[0] as any;
      console.log(`   Sample error: ${firstError.error_type} - ${firstError.description.substring(0, 50)}...`);
    }
    console.log('');

    // Test 2: Get unresolved error logs
    console.log('⚠️  Test 2: Getting unresolved error logs...');
    const unresolvedErrors = await errorFunctions.getUnresolvedErrorLogs();
    console.log(`✅ Found ${unresolvedErrors.length} unresolved error logs`);
    if (unresolvedErrors.length > 0) {
      const firstUnresolved = unresolvedErrors[0] as any;
      console.log(`   Recent unresolved: ${firstUnresolved.error_type} (${firstUnresolved.severity})`);
    }
    console.log('');

    // Test 3: Get resolved error logs
    console.log('✅ Test 3: Getting resolved error logs...');
    const resolvedErrors = await errorFunctions.getResolvedErrorLogs();
    console.log(`✅ Found ${resolvedErrors.length} resolved error logs`);
    if (resolvedErrors.length > 0) {
      const firstResolved = resolvedErrors[0] as any;
      console.log(`   Recent resolved: ${firstResolved.error_type} by ${firstResolved.resolved_admin?.username || 'Unknown'}`);
    }
    console.log('');

    // Test 4: Get critical error logs
    console.log('🚨 Test 4: Getting critical error logs...');
    const criticalErrors = await errorFunctions.getCriticalErrorLogs();
    console.log(`✅ Found ${criticalErrors.length} critical error logs`);
    if (criticalErrors.length > 0) {
      const firstCritical = criticalErrors[0] as any;
      console.log(`   Critical error: ${firstCritical.description.substring(0, 60)}...`);
    }
    console.log('');

    // Test 5: Get high severity error logs
    console.log('🔥 Test 5: Getting high severity error logs...');
    const highSeverityErrors = await errorFunctions.getHighSeverityErrorLogs();
    console.log(`✅ Found ${highSeverityErrors.length} high/critical severity error logs`);
    console.log('');

    // Test 6: Get error logs by severity
    console.log('📊 Test 6: Getting error logs by medium severity...');
    const mediumErrors = await errorFunctions.getErrorLogsBySeverity('medium');
    console.log(`✅ Found ${mediumErrors.length} medium severity error logs`);
    console.log('');

    // Test 7: Get stock mismatch errors
    console.log('📦 Test 7: Getting stock mismatch errors...');
    const stockMismatchErrors = await errorFunctions.getStockMismatchErrors();
    console.log(`✅ Found ${stockMismatchErrors.length} stock mismatch errors`);
    if (stockMismatchErrors.length > 0) {
      const error = stockMismatchErrors[0];
      console.log(`   Sample: Product ${(error as any).products?.name || 'Unknown'} - Expected: ${error.expected_value}, Actual: ${error.actual_value}`);
    }
    console.log('');

    // Test 8: Get price discrepancy errors
    console.log('💰 Test 8: Getting price discrepancy errors...');
    const priceDiscrepancyErrors = await errorFunctions.getPriceDiscrepancyErrors();
    console.log(`✅ Found ${priceDiscrepancyErrors.length} price discrepancy errors`);
    console.log('');

    // Test 9: Get data inconsistency errors
    console.log('🔀 Test 9: Getting data inconsistency errors...');
    const dataInconsistencyErrors = await errorFunctions.getDataInconsistencyErrors();
    console.log(`✅ Found ${dataInconsistencyErrors.length} data inconsistency errors`);
    console.log('');

    // Test 10: Get recent error logs (last 7 days)
    console.log('📅 Test 10: Getting recent error logs (last 7 days)...');
    const recentErrors = await errorFunctions.getRecentErrorLogs(7);
    console.log(`✅ Found ${recentErrors.length} errors in the last 7 days`);
    console.log('');

    // Test 11: Get error logs summary
    console.log('📈 Test 11: Getting error logs summary...');
    const summary = await errorFunctions.getErrorLogsSummary();
    console.log('✅ Error Logs Summary:');
    console.log(`   Total Errors: ${summary.total_errors}`);
    console.log(`   Resolved: ${summary.resolved_errors}`);
    console.log(`   Unresolved: ${summary.unresolved_errors}`);
    console.log(`   Critical: ${summary.critical_errors}`);
    console.log(`   High Severity: ${summary.high_severity_errors}`);
    console.log(`   Resolution Rate: ${summary.resolution_rate}%`);
    console.log(`   Total Discrepancy Amount: $${summary.total_discrepancy_amount.toFixed(2)}`);
    console.log('');

    // Test 12: Get error type distribution
    console.log('📊 Test 12: Getting error type distribution...');
    const typeDistribution = await errorFunctions.getErrorTypeDistribution();
    console.log('✅ Error Type Distribution:');
    typeDistribution.forEach(type => {
      console.log(`   ${type.error_type}: ${type.total} total (${type.resolved} resolved, ${type.unresolved} unresolved)`);
    });
    console.log('');

    // Test 13: Get severity distribution
    console.log('📊 Test 13: Getting severity distribution...');
    const severityDistribution = await errorFunctions.getSeverityDistribution();
    console.log('✅ Severity Distribution:');
    severityDistribution.forEach(severity => {
      console.log(`   ${severity.severity}: ${severity.total} total (${severity.resolved} resolved, ${severity.unresolved} unresolved)`);
    });
    console.log('');

    // Test 14: Get top error-prone products
    console.log('🏆 Test 14: Getting top 5 error-prone products...');
    const topErrorProducts = await errorFunctions.getTopErrorProneProducts(5);
    console.log('✅ Top Error-Prone Products:');
    topErrorProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.product_name} (${product.product_sku}): ${product.error_count} errors`);
    });
    console.log('');

    // Test 15: Get error resolution stats
    console.log('🔧 Test 15: Getting error resolution statistics...');
    const resolutionStats = await errorFunctions.getErrorResolutionStats();
    console.log('✅ Error Resolution Statistics:');
    console.log(`   Total Resolved: ${resolutionStats.total_resolved}`);
    console.log(`   Average Resolution Time: ${resolutionStats.average_resolution_time_hours} hours`);
    if (resolutionStats.resolver_stats.length > 0) {
      console.log('   Top Resolvers:');
      resolutionStats.resolver_stats.slice(0, 3).forEach((resolver, index) => {
        console.log(`     ${index + 1}. ${resolver.resolver_name} (${resolver.resolver_username}): ${resolver.resolved_count} resolved, avg ${resolver.avg_resolution_time_hours}h`);
      });
    }
    console.log('');

    // Test 16: Get error log trends (last 30 days)
    console.log('📈 Test 16: Getting error log trends (last 30 days)...');
    const trends = await errorFunctions.getErrorLogTrends(30);
    console.log(`✅ Found trend data for ${trends.length} days`);
    if (trends.length > 0) {
      const lastDay = trends[trends.length - 1];
      console.log(`   Most recent day (${lastDay.date}): ${lastDay.total_errors} errors, ${lastDay.resolved_errors} resolved`);
      
      const totalErrors = trends.reduce((sum, day) => sum + day.total_errors, 0);
      const totalResolved = trends.reduce((sum, day) => sum + day.resolved_errors, 0);
      console.log(`   30-day totals: ${totalErrors} errors, ${totalResolved} resolved`);
    }
    console.log('');

    // Test 17: Get error logs summary report
    console.log('📋 Test 17: Getting comprehensive summary report...');
    const summaryReport = await errorFunctions.getErrorLogsSummaryReport();
    console.log('✅ Comprehensive Summary Report:');
    console.log(`   Total Errors: ${summaryReport.total_errors}`);
    console.log(`   Resolved: ${summaryReport.resolved_errors} (${summaryReport.resolution_rate}%)`);
    console.log(`   Unresolved: ${summaryReport.unresolved_errors}`);
    console.log(`   Critical: ${summaryReport.critical_errors}`);
    console.log(`   High Severity: ${summaryReport.high_severity_errors}`);
    console.log(`   Errors (Last 7 Days): ${summaryReport.errors_last_7_days}`);
    console.log(`   Errors (Last 30 Days): ${summaryReport.errors_last_30_days}`);
    console.log(`   Resolved (Last 7 Days): ${summaryReport.resolved_last_7_days}`);
    console.log(`   Resolved (Last 30 Days): ${summaryReport.resolved_last_30_days}`);
    console.log(`   Total Discrepancy: $${summaryReport.total_discrepancy_amount.toFixed(2)}`);
    console.log(`   Average Discrepancy: $${summaryReport.avg_discrepancy_amount.toFixed(2)}`);
    console.log('');

    // Test 18: Get error logs by date range (last 7 days)
    console.log('📅 Test 18: Getting error logs by date range (last 7 days)...');
    const endDate = new Date().toISOString();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const dateRangeErrors = await errorFunctions.getErrorLogsByDateRange(startDate.toISOString(), endDate);
    console.log(`✅ Found ${dateRangeErrors.length} errors in the last 7 days`);
    console.log('');

    // Test 19: Test specific error ID lookup (if we have errors)
    if (allErrors.length > 0) {
      console.log('🔍 Test 19: Getting specific error log by ID...');
      const firstError = allErrors[0] as any;
      const specificError = await errorFunctions.getErrorLogById(firstError.id);
      const specificErrorData = specificError as any;
      console.log(`✅ Retrieved specific error: ${specificErrorData.error_type} - ${specificErrorData.description.substring(0, 50)}...`);
      console.log('');

      // Test 20: Get error logs by product (if error has product)
      if (specificErrorData.product_id) {
        console.log('📦 Test 20: Getting error logs by product...');
        const productErrors = await errorFunctions.getErrorLogsByProduct(specificErrorData.product_id);
        console.log(`✅ Found ${productErrors.length} errors for product: ${specificErrorData.products?.name || 'Unknown'}`);
        console.log('');
      }

      // Test 21: Get error logs by admin (if error has admin)
      if (specificErrorData.admin_id) {
        console.log('👤 Test 21: Getting error logs by admin...');
        const adminErrors = await errorFunctions.getErrorLogsByAdmin(specificErrorData.admin_id);
        console.log(`✅ Found ${adminErrors.length} errors reported by admin: ${specificErrorData.admins?.username || 'Unknown'}`);
        console.log('');
      }
    }

    console.log('🎉 All Error Log Function Tests Completed Successfully!\n');

    // Summary of all tests
    console.log('📊 TEST SUMMARY:');
    console.log('================');
    console.log(`✅ Basic Queries: Passed`);
    console.log(`✅ Filtering Functions: Passed`);
    console.log(`✅ Analytics Functions: Passed`);
    console.log(`✅ Reporting Functions: Passed`);
    console.log(`ℹ️  Modification Functions: Disabled for security (read-only access)`);
    console.log('');
    console.log('🔧 Available Error Log Functions:');
    console.log('  📋 Basic Queries:');
    console.log('    - getAllErrorLogs()');
    console.log('    - getErrorLogById(id)');
    console.log('    - getUnresolvedErrorLogs()');
    console.log('    - getResolvedErrorLogs()');
    console.log('    - getRecentErrorLogs(days)');
    console.log('');
    console.log('  🔍 Filtering Functions:');
    console.log('    - getErrorLogsBySeverity(severity)');
    console.log('    - getErrorLogsByType(type)');
    console.log('    - getErrorLogsByProduct(productId)');
    console.log('    - getErrorLogsByAdmin(adminId)');
    console.log('    - getCriticalErrorLogs()');
    console.log('    - getHighSeverityErrorLogs()');
    console.log('    - getStockMismatchErrors()');
    console.log('    - getPriceDiscrepancyErrors()');
    console.log('    - getDataInconsistencyErrors()');
    console.log('    - getErrorLogsByDateRange(start, end)');
    console.log('');
    console.log('  📊 Analytics Functions:');
    console.log('    - getErrorLogsSummary()');
    console.log('    - getErrorTypeDistribution()');
    console.log('    - getSeverityDistribution()');
    console.log('    - getTopErrorProneProducts(limit)');
    console.log('    - getErrorResolutionStats()');
    console.log('    - getErrorLogTrends(days)');
    console.log('    - getErrorLogsSummaryReport()');
    console.log('');
    console.log('  🔒 Security Note:');
    console.log('    - All modification functions (create, update, delete) have been');
    console.log('    - removed for security. Error logs are READ-ONLY through AI chat.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nThis might be due to:');
    console.error('1. Missing environment variables (.env file)');
    console.error('2. Network connectivity issues');
    console.error('3. Database access permissions');
    console.error('4. Missing data in the error_logs table');
    process.exit(1);
  }
}

// Example usage functions for AI prompts
console.log('🤖 AI-Ready Error Log Functions (READ-ONLY):');
console.log('============================================');
console.log('These functions can be used to respond to user queries like:');
console.log('');
console.log('User: "Show me all unresolved errors"');
console.log('AI: calls getUnresolvedErrorLogs()');
console.log('');
console.log('User: "What are the critical errors in the system?"');
console.log('AI: calls getCriticalErrorLogs()');
console.log('');
console.log('User: "Show me stock mismatch errors for the last week"');
console.log('AI: calls getStockMismatchErrors() + filters by date');
console.log('');
console.log('User: "Which products have the most errors?"');
console.log('AI: calls getTopErrorProneProducts()');
console.log('');
console.log('User: "Give me an error report summary"');
console.log('AI: calls getErrorLogsSummaryReport()');
console.log('');
console.log('User: "How is our error resolution performance?"');
console.log('AI: calls getErrorResolutionStats()');
console.log('');
console.log('User: "Show me error trends for the last month"');
console.log('AI: calls getErrorLogTrends(30)');
console.log('');
console.log('🔒 SECURITY: AI cannot create, modify, or delete error logs.');
console.log('   Error logs are READ-ONLY for analysis and reporting only.');
console.log('');

// Run the tests
testErrorLogFunctions().catch(console.error);
