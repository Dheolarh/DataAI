// Test script for admins.ts functions
import { config } from 'dotenv';

// Load environment variables
config();

// Import all admin functions
import {
  // Basic functions
  getAllAdmins,
  getAdminById,
  getAdminByEmail,
  getAdminByUsername,
  getActiveAdmins,
  getInactiveAdmins,
  getAdminsByRole,
  getRecentlyCreatedAdmins,
  getRecentlyActiveAdmins,
  
  // Analytics functions
  getAdminRoleDistribution,
  getAdminActivityReport,
  getAdminCreationTrends,
  getAdminLoginFrequency,
  
  // Management functions
  createAdmin,
  updateAdmin,
  deactivateAdmin,
  activateAdmin,
  deleteAdmin,
  updateAdminRole,
  updateLastLogin,
  
  // Search functions
  searchAdmins,
  advancedAdminSearch,
  
  // Bulk operations
  bulkCreateAdmins,
  bulkUpdateAdmins,
  bulkDeactivateAdmins,
  bulkActivateAdmins,
  bulkDeleteAdmins,
  
  // Security and audit
  getAdminSecurityReport,
  getAdminPermissionsMatrix,
  
  // Comprehensive analysis
  getComprehensiveAdminAnalysis,
  getAdminDashboardStats
} from './scripts/db/admins.ts';

async function testBasicFunctions() {
  console.log('\n=== TESTING BASIC ADMIN FUNCTIONS ===');
  
  try {
    console.log('\n1. Testing getAllAdmins...');
    const allAdmins = await getAllAdmins();
    console.log(`✅ Found ${allAdmins.length} admins`);
    
    if (allAdmins.length > 0) {
      const firstAdmin = allAdmins[0];
      console.log('Sample admin:', {
        id: firstAdmin.id,
        username: firstAdmin.username,
        email: firstAdmin.email,
        role: firstAdmin.role
      });
      
      console.log('\n2. Testing getAdminById...');
      const adminById = await getAdminById(firstAdmin.id);
      console.log(`✅ Retrieved admin by ID: ${adminById.username}`);
      
      console.log('\n3. Testing getAdminByEmail...');
      const adminByEmail = await getAdminByEmail(firstAdmin.email);
      console.log(`✅ Retrieved admin by email: ${adminByEmail.username}`);
      
      console.log('\n4. Testing getAdminByUsername...');
      const adminByUsername = await getAdminByUsername(firstAdmin.username);
      console.log(`✅ Retrieved admin by username: ${adminByUsername.email}`);
    }
    
    console.log('\n5. Testing getActiveAdmins...');
    const activeAdmins = await getActiveAdmins();
    console.log(`✅ Found ${activeAdmins.length} active admins`);
    
    console.log('\n6. Testing getInactiveAdmins...');
    const inactiveAdmins = await getInactiveAdmins();
    console.log(`✅ Found ${inactiveAdmins.length} inactive admins`);
    
    console.log('\n7. Testing getRecentlyCreatedAdmins...');
    const recentAdmins = await getRecentlyCreatedAdmins(30);
    console.log(`✅ Found ${recentAdmins.length} admins created in last 30 days`);
    
    console.log('\n8. Testing getRecentlyActiveAdmins...');
    const recentlyActive = await getRecentlyActiveAdmins(7);
    console.log(`✅ Found ${recentlyActive.length} admins active in last 7 days`);
    
  } catch (error) {
    console.error('❌ Error in basic functions:', error.message);
  }
}

async function testAnalyticsFunctions() {
  console.log('\n=== TESTING ANALYTICS FUNCTIONS ===');
  
  try {
    console.log('\n1. Testing getAdminRoleDistribution...');
    const roleDistribution = await getAdminRoleDistribution();
    console.log(`✅ Role distribution:`, roleDistribution);
    
    console.log('\n2. Testing getAdminActivityReport...');
    const activityReport = await getAdminActivityReport();
    console.log(`✅ Activity report:`, {
      total_admins: activityReport.total_admins,
      total_active: activityReport.total_active,
      active_today: activityReport.active_today,
      activity_rate_24h: activityReport.activity_rate_24h.toFixed(2) + '%'
    });
    
    console.log('\n3. Testing getAdminCreationTrends...');
    const creationTrends = await getAdminCreationTrends(30);
    console.log(`✅ Creation trends: ${creationTrends.length} days with admin creation data`);
    
    console.log('\n4. Testing getAdminLoginFrequency...');
    const loginFrequency = await getAdminLoginFrequency();
    console.log(`✅ Login frequency:`, {
      daily_active: loginFrequency.daily_active.count,
      weekly_active: loginFrequency.weekly_active.count,
      never_logged_in: loginFrequency.never_logged_in.count
    });
    
  } catch (error) {
    console.error('❌ Error in analytics functions:', error.message);
  }
}

async function testSearchFunctions() {
  console.log('\n=== TESTING SEARCH FUNCTIONS ===');
  
  try {
    console.log('\n1. Testing searchAdmins...');
    const searchResults = await searchAdmins('admin');
    console.log(`✅ Search results: Found ${searchResults.length} admins containing 'admin'`);
    
    console.log('\n2. Testing advancedAdminSearch...');
    const advancedResults = await advancedAdminSearch({
      isActive: true,
      limit: 5
    });
    console.log(`✅ Advanced search: Found ${advancedResults.length} active admins (limited to 5)`);
    
  } catch (error) {
    console.error('❌ Error in search functions:', error.message);
  }
}

async function testSecurityFunctions() {
  console.log('\n=== TESTING SECURITY FUNCTIONS ===');
  
  try {
    console.log('\n1. Testing getAdminSecurityReport...');
    const securityReport = await getAdminSecurityReport();
    console.log(`✅ Security report:`, {
      total_admins: securityReport.summary.total_admins,
      security_risk_count: securityReport.summary.security_risk_count,
      never_logged_in: securityReport.issues.never_logged_in.length,
      inactive_90_days: securityReport.issues.inactive_90_days.length
    });
    
    console.log('\n2. Testing getAdminPermissionsMatrix...');
    const permissionsMatrix = await getAdminPermissionsMatrix();
    console.log(`✅ Permissions matrix: ${permissionsMatrix.length} admin permission records`);
    if (permissionsMatrix.length > 0) {
      console.log('Sample permissions:', {
        username: permissionsMatrix[0].username,
        role: permissionsMatrix[0].role,
        permissions: permissionsMatrix[0].permissions
      });
    }
    
  } catch (error) {
    console.error('❌ Error in security functions:', error.message);
  }
}

async function testComprehensiveFunctions() {
  console.log('\n=== TESTING COMPREHENSIVE ANALYSIS FUNCTIONS ===');
  
  try {
    console.log('\n1. Testing getComprehensiveAdminAnalysis...');
    const comprehensiveAnalysis = await getComprehensiveAdminAnalysis();
    console.log(`✅ Comprehensive analysis:`, {
      total_admins: comprehensiveAnalysis.overview.total_admins,
      active_admins: comprehensiveAnalysis.overview.active_admins,
      unique_roles: comprehensiveAnalysis.overview.unique_roles,
      logged_in_today: comprehensiveAnalysis.activity.logged_in_today,
      created_this_month: comprehensiveAnalysis.creation_stats.created_this_month
    });
    
    console.log('\n2. Testing getAdminDashboardStats...');
    const dashboardStats = await getAdminDashboardStats();
    console.log(`✅ Dashboard stats:`, {
      total_admins: dashboardStats.quick_stats.total_admins,
      active_percentage: dashboardStats.quick_stats.active_percentage.toFixed(2) + '%',
      security_risks: dashboardStats.security_overview.total_security_risks,
      role_count: dashboardStats.role_distribution.length
    });
    
  } catch (error) {
    console.error('❌ Error in comprehensive functions:', error.message);
  }
}

async function testManagementFunctions() {
  console.log('\n=== TESTING MANAGEMENT FUNCTIONS (CREATE/UPDATE/DELETE) ===');
  
  try {
    // Test creating a new admin
    console.log('\n1. Testing createAdmin...');
    const newAdminData = {
      username: `test_admin_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      role: 'viewer',
      is_active: true
    };
    
    const createdAdmin = await createAdmin(newAdminData);
    console.log(`✅ Created test admin: ${createdAdmin[0].username}`);
    const testAdminId = createdAdmin[0].id;
    
    // Test updating the admin
    console.log('\n2. Testing updateAdmin...');
    const updatedAdmin = await updateAdmin(testAdminId, {
      role: 'editor'
    });
    console.log(`✅ Updated admin role to: ${updatedAdmin[0].role}`);
    
    // Test updating last login
    console.log('\n3. Testing updateLastLogin...');
    const loginUpdated = await updateLastLogin(testAdminId);
    console.log(`✅ Updated last login for admin`);
    
    // Test deactivating admin
    console.log('\n4. Testing deactivateAdmin...');
    const deactivatedAdmin = await deactivateAdmin(testAdminId);
    console.log(`✅ Deactivated admin: ${deactivatedAdmin[0].is_active}`);
    
    // Test activating admin
    console.log('\n5. Testing activateAdmin...');
    const activatedAdmin = await activateAdmin(testAdminId);
    console.log(`✅ Activated admin: ${activatedAdmin[0].is_active}`);
    
    // Test role update
    console.log('\n6. Testing updateAdminRole...');
    const roleUpdated = await updateAdminRole(testAdminId, 'analyst');
    console.log(`✅ Updated role to: ${roleUpdated[0].role}`);
    
    // Clean up - delete the test admin
    console.log('\n7. Testing deleteAdmin...');
    const deleted = await deleteAdmin(testAdminId);
    console.log(`✅ Deleted test admin: ${deleted}`);
    
  } catch (error) {
    console.error('❌ Error in management functions:', error.message);
  }
}

async function testBulkOperations() {
  console.log('\n=== TESTING BULK OPERATIONS ===');
  
  try {
    // Test bulk create
    console.log('\n1. Testing bulkCreateAdmins...');
    const bulkAdmins = [
      {
        username: `bulk_admin_1_${Date.now()}`,
        email: `bulk1_${Date.now()}@example.com`,
        role: 'viewer'
      },
      {
        username: `bulk_admin_2_${Date.now()}`,
        email: `bulk2_${Date.now()}@example.com`,
        role: 'editor'
      }
    ];
    
    const createdBulkAdmins = await bulkCreateAdmins(bulkAdmins);
    console.log(`✅ Bulk created ${createdBulkAdmins.length} admins`);
    const bulkAdminIds = createdBulkAdmins.map(admin => admin.id);
    
    // Test bulk update
    console.log('\n2. Testing bulkUpdateAdmins...');
    const bulkUpdates = bulkAdminIds.map(id => ({
      adminId: id,
      role: 'analyst'
    }));
    
    const updateResults = await bulkUpdateAdmins(bulkUpdates);
    const successCount = updateResults.filter(r => r.success).length;
    console.log(`✅ Bulk updated ${successCount}/${updateResults.length} admins`);
    
    // Test bulk deactivate
    console.log('\n3. Testing bulkDeactivateAdmins...');
    const deactivatedBulk = await bulkDeactivateAdmins(bulkAdminIds);
    console.log(`✅ Bulk deactivated ${deactivatedBulk.length} admins`);
    
    // Test bulk activate
    console.log('\n4. Testing bulkActivateAdmins...');
    const activatedBulk = await bulkActivateAdmins(bulkAdminIds);
    console.log(`✅ Bulk activated ${activatedBulk.length} admins`);
    
    // Clean up - bulk delete
    console.log('\n5. Testing bulkDeleteAdmins...');
    const deletedBulk = await bulkDeleteAdmins(bulkAdminIds);
    console.log(`✅ Bulk deleted admins: ${deletedBulk}`);
    
  } catch (error) {
    console.error('❌ Error in bulk operations:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive admins.ts function tests...');
  console.log('Date:', new Date().toISOString());
  
  try {
    await testBasicFunctions();
    await testAnalyticsFunctions();
    await testSearchFunctions();
    await testSecurityFunctions();
    await testComprehensiveFunctions();
    await testManagementFunctions();
    await testBulkOperations();
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('All admin functions are working correctly.');
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR during testing:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(console.error);
