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

// ===== BASIC ERROR LOG FUNCTIONS =====

export async function getAllErrorLogs() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      ),
      resolved_admin:admins!error_logs_resolved_by_fkey (
        username,
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch error logs: " + error.message);
  }

  return data ?? [];
}

export async function getErrorLogById(errorId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price,
        current_stock
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      ),
      resolved_admin:admins!error_logs_resolved_by_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("id", errorId)
    .single();

  if (error) {
    throw new Error("Failed to fetch error log: " + error.message);
  }

  return data;
}

export async function getUnresolvedErrorLogs() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("resolved", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch unresolved error logs: " + error.message);
  }

  return data ?? [];
}

export async function getResolvedErrorLogs() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      ),
      resolved_admin:admins!error_logs_resolved_by_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("resolved", true)
    .order("resolved_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch resolved error logs: " + error.message);
  }

  return data ?? [];
}

export async function getErrorLogsBySeverity(severity: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("severity", severity)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch error logs by severity: " + error.message);
  }

  return data ?? [];
}

export async function getErrorLogsByType(errorType: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("error_type", errorType)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch error logs by type: " + error.message);
  }

  return data ?? [];
}

export async function getErrorLogsByProduct(productId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price,
        current_stock
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      ),
      resolved_admin:admins!error_logs_resolved_by_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch error logs by product: " + error.message);
  }

  return data ?? [];
}

export async function getErrorLogsByAdmin(adminId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch error logs by admin: " + error.message);
  }

  return data ?? [];
}

export async function getRecentErrorLogs(days: number = 7) {
  const client = getSupabaseClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch recent error logs: " + error.message);
  }

  return data ?? [];
}

export async function getCriticalErrorLogs() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("severity", "critical")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch critical error logs: " + error.message);
  }

  return data ?? [];
}

export async function getHighSeverityErrorLogs() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .in("severity", ["high", "critical"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch high severity error logs: " + error.message);
  }

  return data ?? [];
}

// ===== ERROR LOG ANALYTICS FUNCTIONS =====

export async function getErrorLogsSummary() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select("id, error_type, severity, resolved, discrepancy_amount, created_at");

  if (error) {
    throw new Error("Failed to fetch error logs summary: " + error.message);
  }

  const summary = {
    total_errors: data?.length || 0,
    resolved_errors: data?.filter(e => e.resolved).length || 0,
    unresolved_errors: data?.filter(e => !e.resolved).length || 0,
    critical_errors: data?.filter(e => e.severity === "critical").length || 0,
    high_severity_errors: data?.filter(e => e.severity === "high").length || 0,
    medium_severity_errors: data?.filter(e => e.severity === "medium").length || 0,
    low_severity_errors: data?.filter(e => e.severity === "low").length || 0,
    total_discrepancy_amount: data?.reduce((sum, e) => sum + (parseFloat(e.discrepancy_amount?.toString() || "0")), 0) || 0,
    resolution_rate: data?.length ? ((data?.filter(e => e.resolved).length / data?.length) * 100).toFixed(2) : "0.00"
  };

  return summary;
}

export async function getErrorTypeDistribution() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select("error_type, resolved, severity");

  if (error) {
    throw new Error("Failed to fetch error type distribution: " + error.message);
  }

  const distribution = new Map<string, {
    total: number;
    resolved: number;
    unresolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }>();

  for (const errorLog of data ?? []) {
    const errorType = errorLog.error_type as string || 'Unknown';
    const resolved = errorLog.resolved as boolean;
    const severity = errorLog.severity as string || 'medium';

    if (!distribution.has(errorType)) {
      distribution.set(errorType, {
        total: 0,
        resolved: 0,
        unresolved: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      });
    }

    const stats = distribution.get(errorType)!;
    stats.total++;

    if (resolved) {
      stats.resolved++;
    } else {
      stats.unresolved++;
    }

    switch (severity) {
      case 'critical':
        stats.critical++;
        break;
      case 'high':
        stats.high++;
        break;
      case 'medium':
        stats.medium++;
        break;
      case 'low':
        stats.low++;
        break;
    }
  }

  return Array.from(distribution.entries()).map(([errorType, stats]) => ({
    error_type: errorType,
    ...stats
  }));
}

export async function getSeverityDistribution() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select("severity, resolved, error_type");

  if (error) {
    throw new Error("Failed to fetch severity distribution: " + error.message);
  }

  const distribution = new Map<string, {
    total: number;
    resolved: number;
    unresolved: number;
    stock_mismatch: number;
    price_discrepancy: number;
    data_inconsistency: number;
    other: number;
  }>();

  for (const errorLog of data ?? []) {
    const severity = errorLog.severity as string || 'medium';
    const resolved = errorLog.resolved as boolean;
    const errorType = errorLog.error_type as string || 'other';

    if (!distribution.has(severity)) {
      distribution.set(severity, {
        total: 0,
        resolved: 0,
        unresolved: 0,
        stock_mismatch: 0,
        price_discrepancy: 0,
        data_inconsistency: 0,
        other: 0
      });
    }

    const stats = distribution.get(severity)!;
    stats.total++;

    if (resolved) {
      stats.resolved++;
    } else {
      stats.unresolved++;
    }

    switch (errorType) {
      case 'stock_mismatch':
        stats.stock_mismatch++;
        break;
      case 'price_discrepancy':
        stats.price_discrepancy++;
        break;
      case 'data_inconsistency':
        stats.data_inconsistency++;
        break;
      default:
        stats.other++;
        break;
    }
  }

  return Array.from(distribution.entries()).map(([severity, stats]) => ({
    severity,
    ...stats
  }));
}

export async function getErrorLogsByDateRange(startDate: string, endDate: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      ),
      resolved_admin:admins!error_logs_resolved_by_fkey (
        username,
        email,
        full_name
      )
    `)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch error logs by date range: " + error.message);
  }

  return data ?? [];
}

export async function getTopErrorProneProducts(limit: number = 10) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      product_id,
      products (
        name,
        sku,
        selling_price,
        current_stock
      )
    `)
    .not("product_id", "is", null);

  if (error) {
    throw new Error("Failed to fetch error-prone products: " + error.message);
  }

  const productErrors = new Map<string, {
    product_id: string;
    product_name: string;
    product_sku: string;
    selling_price: number;
    current_stock: number;
    error_count: number;
  }>();

  for (const errorLog of data ?? []) {
    const productId = errorLog.product_id as string;
    const product = errorLog.products as any;

    if (!productErrors.has(productId)) {
      productErrors.set(productId, {
        product_id: productId,
        product_name: product?.name || 'Unknown Product',
        product_sku: product?.sku || 'N/A',
        selling_price: product?.selling_price || 0,
        current_stock: product?.current_stock || 0,
        error_count: 0
      });
    }

    const productError = productErrors.get(productId)!;
    productError.error_count++;
  }

  return Array.from(productErrors.values())
    .sort((a, b) => b.error_count - a.error_count)
    .slice(0, limit);
}

export async function getErrorResolutionStats() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      resolved_admin:admins!error_logs_resolved_by_fkey (
        username,
        full_name
      )
    `)
    .eq("resolved", true)
    .not("resolved_at", "is", null);

  if (error) {
    throw new Error("Failed to fetch error resolution stats: " + error.message);
  }

  const resolverStats = new Map<string, {
    resolver_id: string;
    resolver_name: string;
    resolver_username: string;
    resolved_count: number;
    avg_resolution_time_hours: number;
    total_resolution_time_hours: number;
  }>();

  let totalResolutionTimeHours = 0;
  let totalResolved = 0;

  for (const errorLog of data ?? []) {
    const resolverId = errorLog.resolved_by as string;
    const resolverAdmin = errorLog.resolved_admin as any;
    const createdAt = new Date(errorLog.created_at as string);
    const resolvedAt = new Date(errorLog.resolved_at as string);
    const resolutionTimeHours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    totalResolutionTimeHours += resolutionTimeHours;
    totalResolved++;

    if (!resolverStats.has(resolverId)) {
      resolverStats.set(resolverId, {
        resolver_id: resolverId,
        resolver_name: resolverAdmin?.full_name || 'Unknown Admin',
        resolver_username: resolverAdmin?.username || 'unknown',
        resolved_count: 0,
        avg_resolution_time_hours: 0,
        total_resolution_time_hours: 0
      });
    }

    const stats = resolverStats.get(resolverId)!;
    stats.resolved_count++;
    stats.total_resolution_time_hours += resolutionTimeHours;
    stats.avg_resolution_time_hours = stats.total_resolution_time_hours / stats.resolved_count;
  }

  const avgResolutionTimeHours = totalResolved > 0 ? totalResolutionTimeHours / totalResolved : 0;

  return {
    total_resolved: totalResolved,
    average_resolution_time_hours: parseFloat(avgResolutionTimeHours.toFixed(2)),
    resolver_stats: Array.from(resolverStats.values())
      .sort((a, b) => b.resolved_count - a.resolved_count)
      .map(stat => ({
        ...stat,
        avg_resolution_time_hours: parseFloat(stat.avg_resolution_time_hours.toFixed(2))
      }))
  };
}

export async function getStockMismatchErrors() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price,
        current_stock
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("error_type", "stock_mismatch")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch stock mismatch errors: " + error.message);
  }

  return data ?? [];
}

export async function getPriceDiscrepancyErrors() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price,
        current_stock
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("error_type", "price_discrepancy")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch price discrepancy errors: " + error.message);
  }

  return data ?? [];
}

export async function getDataInconsistencyErrors() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select(`
      id,
      error_type,
      description,
      product_id,
      admin_id,
      expected_value,
      actual_value,
      discrepancy_amount,
      severity,
      resolved,
      resolved_by,
      resolved_at,
      created_at,
      products (
        name,
        sku,
        selling_price,
        current_stock
      ),
      admins!error_logs_admin_id_fkey (
        username,
        email,
        full_name
      )
    `)
    .eq("error_type", "data_inconsistency")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch data inconsistency errors: " + error.message);
  }

  return data ?? [];
}

// ===== ERROR LOG READ-ONLY FUNCTIONS =====
// Note: Write/modification functions have been removed for security.
// Error logs can only be viewed and analyzed through these functions.

// ===== ERROR LOG REPORTING FUNCTIONS =====

export async function getErrorLogTrends(days: number = 30) {
  const client = getSupabaseClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("error_logs")
    .select("id, error_type, severity, resolved, created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch error log trends: " + error.message);
  }

  const trendsMap = new Map<string, {
    date: string;
    total_errors: number;
    resolved_errors: number;
    unresolved_errors: number;
    critical_errors: number;
    high_errors: number;
    stock_mismatch: number;
    price_discrepancy: number;
    data_inconsistency: number;
  }>();

  for (const errorLog of data ?? []) {
    const date = new Date(errorLog.created_at as string).toISOString().split('T')[0];
    const errorType = errorLog.error_type as string;
    const severity = errorLog.severity as string;
    const resolved = errorLog.resolved as boolean;

    if (!trendsMap.has(date)) {
      trendsMap.set(date, {
        date,
        total_errors: 0,
        resolved_errors: 0,
        unresolved_errors: 0,
        critical_errors: 0,
        high_errors: 0,
        stock_mismatch: 0,
        price_discrepancy: 0,
        data_inconsistency: 0
      });
    }

    const dayStats = trendsMap.get(date)!;
    dayStats.total_errors++;

    if (resolved) {
      dayStats.resolved_errors++;
    } else {
      dayStats.unresolved_errors++;
    }

    if (severity === 'critical') {
      dayStats.critical_errors++;
    } else if (severity === 'high') {
      dayStats.high_errors++;
    }

    switch (errorType) {
      case 'stock_mismatch':
        dayStats.stock_mismatch++;
        break;
      case 'price_discrepancy':
        dayStats.price_discrepancy++;
        break;
      case 'data_inconsistency':
        dayStats.data_inconsistency++;
        break;
    }
  }

  return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getErrorLogsSummaryReport() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("error_logs")
    .select("id, error_type, severity, resolved, discrepancy_amount, created_at, resolved_at");

  if (error) {
    throw new Error("Failed to fetch error logs for summary report: " + error.message);
  }

  const now = new Date();
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);

  const summary = {
    total_errors: data?.length || 0,
    resolved_errors: data?.filter(e => e.resolved).length || 0,
    unresolved_errors: data?.filter(e => !e.resolved).length || 0,
    critical_errors: data?.filter(e => e.severity === "critical").length || 0,
    high_severity_errors: data?.filter(e => e.severity === "high").length || 0,
    errors_last_7_days: data?.filter(e => new Date(e.created_at as string) >= last7Days).length || 0,
    errors_last_30_days: data?.filter(e => new Date(e.created_at as string) >= last30Days).length || 0,
    resolved_last_7_days: data?.filter(e => e.resolved && e.resolved_at && new Date(e.resolved_at as string) >= last7Days).length || 0,
    resolved_last_30_days: data?.filter(e => e.resolved && e.resolved_at && new Date(e.resolved_at as string) >= last30Days).length || 0,
    total_discrepancy_amount: data?.reduce((sum, e) => sum + (parseFloat(e.discrepancy_amount?.toString() || "0")), 0) || 0,
    avg_discrepancy_amount: data?.length ? (data?.reduce((sum, e) => sum + (parseFloat(e.discrepancy_amount?.toString() || "0")), 0) / data.length) : 0,
    resolution_rate: data?.length ? ((data?.filter(e => e.resolved).length / data?.length) * 100).toFixed(2) : "0.00"
  };

  return summary;
}
