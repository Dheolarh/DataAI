import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
    }
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

// ===== BASIC ADMIN FUNCTIONS =====

export async function getAllAdmins() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, full_name, role, is_active, created_at, updated_at, last_login")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch admins: " + error.message);
  }

  return data ?? [];
}

export async function getAdminById(adminId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, full_name, role, is_active, created_at, updated_at, last_login")
    .eq("id", adminId)
    .single();

  if (error) {
    throw new Error("Failed to fetch admin: " + error.message);
  }

  return data;
}

export async function getAdminByEmail(email: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, full_name, role, is_active, created_at, updated_at, last_login")
    .eq("email", email)
    .single();

  if (error) {
    throw new Error("Failed to fetch admin by email: " + error.message);
  }

  return data;
}

export async function getAdminByUsername(username: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, full_name, role, is_active, created_at, updated_at, last_login")
    .eq("username", username)
    .single();

  if (error) {
    throw new Error("Failed to fetch admin by username: " + error.message);
  }

  return data;
}

export async function getActiveAdmins() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, full_name, role, is_active, created_at, updated_at, last_login")
    .eq("is_active", true)
    .order("last_login", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error("Failed to fetch active admins: " + error.message);
  }

  return data ?? [];
}

export async function getInactiveAdmins() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, role, is_active, created_at, updated_at, last_login")
    .eq("is_active", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch inactive admins: " + error.message);
  }

  return data ?? [];
}

export async function getAdminsByRole(role: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, role, is_active, created_at, updated_at, last_login")
    .eq("role", role)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch admins by role: " + error.message);
  }

  return data ?? [];
}

export async function getRecentlyCreatedAdmins(days: number = 30) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, role, is_active, created_at, updated_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch recently created admins: " + error.message);
  }

  return data ?? [];
}

export async function getRecentlyActiveAdmins(days: number = 7) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, role, last_login")
    .gte("last_login", startDate.toISOString())
    .order("last_login", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch recently active admins: " + error.message);
  }

  return data ?? [];
}

// ===== ADMIN ANALYTICS FUNCTIONS =====

export async function getAdminRoleDistribution() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("role, is_active");

  if (error) {
    throw new Error("Failed to fetch admin roles: " + error.message);
  }

  const roleStats = new Map<string, {
    total: number;
    active: number;
    inactive: number;
  }>();

  for (const admin of data ?? []) {
    const role = admin.role as string || 'Unknown';
    const isActive = admin.is_active as boolean;

    if (!roleStats.has(role)) {
      roleStats.set(role, { total: 0, active: 0, inactive: 0 });
    }

    const stats = roleStats.get(role)!;
    stats.total++;
    if (isActive) {
      stats.active++;
    } else {
      stats.inactive++;
    }
  }

  const results: Array<{
    role: string;
    total_count: number;
    active_count: number;
    inactive_count: number;
    active_percentage: number;
  }> = [];

  for (const [role, stats] of roleStats.entries()) {
    results.push({
      role,
      total_count: stats.total,
      active_count: stats.active,
      inactive_count: stats.inactive,
      active_percentage: stats.total > 0 ? (stats.active / stats.total) * 100 : 0
    });
  }

  return results.sort((a, b) => b.total_count - a.total_count);
}

export async function getAdminActivityReport() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, role, is_active, created_at, last_login");

  if (error) {
    throw new Error("Failed to fetch admin activity: " + error.message);
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let activeToday = 0;
  let activeThisWeek = 0;
  let activeThisMonth = 0;
  let neverLoggedIn = 0;
  let totalActive = 0;

  for (const admin of data ?? []) {
    const isActive = admin.is_active as boolean;
    const lastLogin = admin.last_login ? new Date(admin.last_login as string) : null;

    if (isActive) {
      totalActive++;
    }

    if (!lastLogin) {
      neverLoggedIn++;
      continue;
    }

    if (lastLogin >= oneDayAgo) {
      activeToday++;
    }
    if (lastLogin >= oneWeekAgo) {
      activeThisWeek++;
    }
    if (lastLogin >= oneMonthAgo) {
      activeThisMonth++;
    }
  }

  return {
    total_admins: data?.length || 0,
    total_active: totalActive,
    total_inactive: (data?.length || 0) - totalActive,
    active_today: activeToday,
    active_this_week: activeThisWeek,
    active_this_month: activeThisMonth,
    never_logged_in: neverLoggedIn,
    activity_rate_24h: data?.length ? (activeToday / data.length) * 100 : 0,
    activity_rate_7d: data?.length ? (activeThisWeek / data.length) * 100 : 0,
    activity_rate_30d: data?.length ? (activeThisMonth / data.length) * 100 : 0
  };
}

export async function getAdminCreationTrends(days: number = 30) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("admins")
    .select("created_at, role")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch admin creation trends: " + error.message);
  }

  const dailyCreations = new Map<string, {
    count: number;
    roles: Record<string, number>;
  }>();

  for (const admin of data ?? []) {
    const date = new Date(admin.created_at as string).toISOString().split('T')[0];
    const role = admin.role as string || 'Unknown';

    if (!dailyCreations.has(date)) {
      dailyCreations.set(date, { count: 0, roles: {} });
    }

    const stats = dailyCreations.get(date)!;
    stats.count++;
    stats.roles[role] = (stats.roles[role] || 0) + 1;
  }

  const results: Array<{
    date: string;
    admin_count: number;
    role_breakdown: Record<string, number>;
  }> = [];

  for (const [date, stats] of dailyCreations.entries()) {
    results.push({
      date,
      admin_count: stats.count,
      role_breakdown: stats.roles
    });
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAdminLoginFrequency() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, role, last_login, created_at");

  if (error) {
    throw new Error("Failed to fetch admin login data: " + error.message);
  }

  const now = new Date();
  const categories = {
    daily_users: [] as any[],      // Logged in within 24 hours
    weekly_users: [] as any[],     // Logged in within 7 days
    monthly_users: [] as any[],    // Logged in within 30 days
    inactive_users: [] as any[],   // Haven't logged in for 30+ days
    never_logged_in: [] as any[]   // Never logged in
  };

  for (const admin of data ?? []) {
    const lastLogin = admin.last_login ? new Date(admin.last_login as string) : null;
    const daysSinceLogin = lastLogin ? (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24) : null;

    if (!lastLogin) {
      categories.never_logged_in.push(admin);
    } else if (daysSinceLogin !== null) {
      if (daysSinceLogin <= 1) {
        categories.daily_users.push(admin);
      } else if (daysSinceLogin <= 7) {
        categories.weekly_users.push(admin);
      } else if (daysSinceLogin <= 30) {
        categories.monthly_users.push(admin);
      } else {
        categories.inactive_users.push(admin);
      }
    }
  }

  return {
    daily_active: {
      count: categories.daily_users.length,
      users: categories.daily_users
    },
    weekly_active: {
      count: categories.weekly_users.length,
      users: categories.weekly_users
    },
    monthly_active: {
      count: categories.monthly_users.length,
      users: categories.monthly_users
    },
    inactive: {
      count: categories.inactive_users.length,
      users: categories.inactive_users
    },
    never_logged_in: {
      count: categories.never_logged_in.length,
      users: categories.never_logged_in
    }
  };
}

// ===== ADMIN MANAGEMENT FUNCTIONS =====

export async function createAdmin(adminData: {
  username: string;
  email: string;
  full_name: string;
  password_hash?: string;
  role: string;
  is_active?: boolean;
}) {
  const client = getSupabaseClient();

  const newAdmin = {
    ...adminData,
    is_active: adminData.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from("admins")
    .insert([newAdmin])
    .select();

  if (error) {
    throw new Error("Failed to create admin: " + error.message);
  }

  return data;
}

export async function updateAdmin(adminId: string, updates: {
  username?: string;
  email?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
}) {
  const client = getSupabaseClient();

  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from("admins")
    .update(updateData)
    .eq("id", adminId)
    .select();

  if (error) {
    throw new Error("Failed to update admin: " + error.message);
  }

  return data;
}

export async function deactivateAdmin(adminId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .update({ 
      is_active: false, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", adminId)
    .select();

  if (error) {
    throw new Error("Failed to deactivate admin: " + error.message);
  }

  return data;
}

export async function activateAdmin(adminId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .update({ 
      is_active: true, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", adminId)
    .select();

  if (error) {
    throw new Error("Failed to activate admin: " + error.message);
  }

  return data;
}

export async function deleteAdmin(adminId: string) {
  const client = getSupabaseClient();

  const { error } = await client
    .from("admins")
    .delete()
    .eq("id", adminId);

  if (error) {
    throw new Error("Failed to delete admin: " + error.message);
  }

  return true;
}

export async function updateAdminRole(adminId: string, newRole: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .update({ 
      role: newRole, 
      updated_at: new Date().toISOString() 
    })
    .eq("id", adminId)
    .select();

  if (error) {
    throw new Error("Failed to update admin role: " + error.message);
  }

  return data;
}

export async function updateLastLogin(adminId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .update({ 
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", adminId)
    .select();

  if (error) {
    throw new Error("Failed to update last login: " + error.message);
  }

  return data;
}

// ===== SEARCH AND FILTER FUNCTIONS =====

export async function searchAdmins(searchTerm: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, full_name, role, is_active, created_at, updated_at, last_login")
    .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to search admins: " + error.message);
  }

  return data ?? [];
}

export async function advancedAdminSearch(filters: {
  role?: string;
  isActive?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  searchTerm?: string;
  limit?: number;
}) {
  const client = getSupabaseClient();

  let query = client
    .from("admins")
    .select("id, username, email, full_name, role, is_active, created_at, updated_at, last_login");

  if (filters.role) {
    query = query.eq("role", filters.role);
  }
  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }
  if (filters.createdAfter) {
    query = query.gte("created_at", filters.createdAfter);
  }
  if (filters.createdBefore) {
    query = query.lte("created_at", filters.createdBefore);
  }
  if (filters.lastLoginAfter) {
    query = query.gte("last_login", filters.lastLoginAfter);
  }
  if (filters.lastLoginBefore) {
    query = query.lte("last_login", filters.lastLoginBefore);
  }
  if (filters.searchTerm) {
    query = query.or(`username.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to search admins: " + error.message);
  }

  return data ?? [];
}

// ===== BULK OPERATIONS =====

export async function bulkCreateAdmins(admins: Array<{
  username: string;
  email: string;
  full_name: string;
  password_hash?: string;
  role: string;
  is_active?: boolean;
}>) {
  const client = getSupabaseClient();

  const adminsWithTimestamp = admins.map(admin => ({
    ...admin,
    is_active: admin.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await client
    .from("admins")
    .insert(adminsWithTimestamp)
    .select();

  if (error) {
    throw new Error("Failed to bulk create admins: " + error.message);
  }

  return data;
}

export async function bulkUpdateAdmins(updates: Array<{
  adminId: string;
  username?: string;
  email?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
}>) {
  const client = getSupabaseClient();

  const results: Array<{
    adminId: string;
    success: boolean;
    data?: any;
    error?: string;
  }> = [];

  for (const update of updates) {
    try {
      const { adminId, ...updateData } = update;
      const { data, error } = await client
        .from("admins")
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq("id", adminId)
        .select();

      if (error) {
        results.push({ adminId, success: false, error: error.message });
      } else {
        results.push({ adminId, success: true, data });
      }
    } catch (err) {
      results.push({ 
        adminId: update.adminId, 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  }

  return results;
}

export async function bulkDeactivateAdmins(adminIds: string[]) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .update({ 
      is_active: false, 
      updated_at: new Date().toISOString() 
    })
    .in("id", adminIds)
    .select();

  if (error) {
    throw new Error("Failed to bulk deactivate admins: " + error.message);
  }

  return data;
}

export async function bulkActivateAdmins(adminIds: string[]) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .update({ 
      is_active: true, 
      updated_at: new Date().toISOString() 
    })
    .in("id", adminIds)
    .select();

  if (error) {
    throw new Error("Failed to bulk activate admins: " + error.message);
  }

  return data;
}

export async function bulkDeleteAdmins(adminIds: string[]) {
  const client = getSupabaseClient();

  const { error } = await client
    .from("admins")
    .delete()
    .in("id", adminIds);

  if (error) {
    throw new Error("Failed to bulk delete admins: " + error.message);
  }

  return true;
}

// ===== SECURITY AND AUDIT FUNCTIONS =====

export async function getAdminSecurityReport() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, role, is_active, created_at, last_login");

  if (error) {
    throw new Error("Failed to fetch admin security data: " + error.message);
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const securityIssues = {
    never_logged_in: [] as any[],
    inactive_30_days: [] as any[],
    inactive_90_days: [] as any[],
    active_but_no_recent_login: [] as any[]
  };

  for (const admin of data ?? []) {
    const lastLogin = admin.last_login ? new Date(admin.last_login as string) : null;
    const isActive = admin.is_active as boolean;

    if (!lastLogin) {
      securityIssues.never_logged_in.push(admin);
    } else {
      if (lastLogin < ninetyDaysAgo) {
        securityIssues.inactive_90_days.push(admin);
      } else if (lastLogin < thirtyDaysAgo) {
        securityIssues.inactive_30_days.push(admin);
      }

      if (isActive && lastLogin < thirtyDaysAgo) {
        securityIssues.active_but_no_recent_login.push(admin);
      }
    }
  }

  return {
    summary: {
      total_admins: data?.length || 0,
      security_risk_count: 
        securityIssues.never_logged_in.length +
        securityIssues.inactive_90_days.length +
        securityIssues.active_but_no_recent_login.length
    },
    issues: securityIssues
  };
}

export async function getAdminPermissionsMatrix() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, role, is_active");

  if (error) {
    throw new Error("Failed to fetch admin permissions: " + error.message);
  }

  // Define role permissions (this could be moved to a separate configuration)
  const rolePermissions = {
    'super_admin': ['all'],
    'admin': ['read', 'write', 'delete', 'manage_users'],
    'manager': ['read', 'write', 'reports'],
    'editor': ['read', 'write'],
    'viewer': ['read'],
    'analyst': ['read', 'reports']
  };

  const results: Array<{
    admin_id: string;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
    permissions: string[];
  }> = [];

  for (const admin of data ?? []) {
    const role = admin.role as string;
    const permissions = rolePermissions[role as keyof typeof rolePermissions] || [];

    results.push({
      admin_id: admin.id as string,
      username: admin.username as string,
      email: admin.email as string,
      role,
      is_active: admin.is_active as boolean,
      permissions
    });
  }

  return results;
}

// ===== COMPREHENSIVE ANALYSIS FUNCTIONS =====

export async function getComprehensiveAdminAnalysis() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("admins")
    .select("id, username, email, role, is_active, created_at, updated_at, last_login");

  if (error) {
    throw new Error("Failed to fetch comprehensive admin data: " + error.message);
  }

  const now = new Date();
  const analysis = {
    overview: {
      total_admins: data?.length || 0,
      active_admins: 0,
      inactive_admins: 0,
      never_logged_in: 0,
      roles: new Set<string>()
    },
    activity: {
      logged_in_today: 0,
      logged_in_this_week: 0,
      logged_in_this_month: 0,
      average_days_since_last_login: 0
    },
    creation_stats: {
      created_this_month: 0,
      created_this_year: 0,
      oldest_account: null as any,
      newest_account: null as any
    }
  };

  let totalDaysSinceLogin = 0;
  let adminsWithLogin = 0;

  for (const admin of data ?? []) {
    const isActive = admin.is_active as boolean;
    const lastLogin = admin.last_login ? new Date(admin.last_login as string) : null;
    const createdAt = new Date(admin.created_at as string);
    const role = admin.role as string;

    // Overview stats
    if (isActive) {
      analysis.overview.active_admins++;
    } else {
      analysis.overview.inactive_admins++;
    }
    analysis.overview.roles.add(role);

    // Activity stats
    if (!lastLogin) {
      analysis.overview.never_logged_in++;
    } else {
      adminsWithLogin++;
      const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      totalDaysSinceLogin += daysSinceLogin;

      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (lastLogin >= oneDayAgo) analysis.activity.logged_in_today++;
      if (lastLogin >= oneWeekAgo) analysis.activity.logged_in_this_week++;
      if (lastLogin >= oneMonthAgo) analysis.activity.logged_in_this_month++;
    }

    // Creation stats
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    if (createdAt >= thisMonth) analysis.creation_stats.created_this_month++;
    if (createdAt >= thisYear) analysis.creation_stats.created_this_year++;

    if (!analysis.creation_stats.oldest_account || createdAt < new Date(analysis.creation_stats.oldest_account.created_at)) {
      analysis.creation_stats.oldest_account = admin;
    }
    if (!analysis.creation_stats.newest_account || createdAt > new Date(analysis.creation_stats.newest_account.created_at)) {
      analysis.creation_stats.newest_account = admin;
    }
  }

  analysis.activity.average_days_since_last_login = 
    adminsWithLogin > 0 ? totalDaysSinceLogin / adminsWithLogin : 0;

  return {
    ...analysis,
    overview: {
      ...analysis.overview,
      unique_roles: analysis.overview.roles.size,
      roles_list: Array.from(analysis.overview.roles)
    }
  };
}

export async function getAdminDashboardStats() {
  const client = getSupabaseClient();

  const [roleDistribution, activityReport, securityReport] = await Promise.all([
    getAdminRoleDistribution(),
    getAdminActivityReport(),
    getAdminSecurityReport()
  ]);

  return {
    role_distribution: roleDistribution,
    activity_summary: activityReport,
    security_overview: {
      total_security_risks: securityReport.summary.security_risk_count,
      never_logged_in_count: securityReport.issues.never_logged_in.length,
      inactive_90_days_count: securityReport.issues.inactive_90_days.length,
      active_no_recent_login_count: securityReport.issues.active_but_no_recent_login.length
    },
    quick_stats: {
      total_admins: activityReport.total_admins,
      active_percentage: activityReport.total_admins > 0 ? 
        (activityReport.total_active / activityReport.total_admins) * 100 : 0,
      daily_activity_rate: activityReport.activity_rate_24h,
      weekly_activity_rate: activityReport.activity_rate_7d
    }
  };
}
