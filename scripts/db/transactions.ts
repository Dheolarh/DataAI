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

export async function getTotalSales(options?: { startDate?: string; endDate?: string }) {
  const client = getSupabaseClient();
  let query = client.from("transactions").select("total_amount");

  if (options?.startDate && options?.endDate) {
    query = query
      .gte("transaction_time", options.startDate)
      .lte("transaction_time", options.endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  type Transaction = { total_amount: number };
  const total = (data as Transaction[] | null)?.reduce((sum, txn) => sum + txn.total_amount, 0) || 0;
  return total;
}

export async function listTransactions(options?: {
  limit?: number;
  productId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const client = getSupabaseClient();

  let query = client
    .from("transactions")
    .select(`
      id,
      transaction_id,
      quantity,
      unit_price,
      total_amount,
      transaction_time,
      customer_location,
      product_id,
      products (
        name,
        sku,
        selling_price
      )
    `)
    .order("transaction_time", { ascending: false });

  if (options?.productId) {
    query = query.eq("product_id", options.productId);
  }

  if (options?.startDate && options?.endDate) {
    query = query
      .gte("transaction_time", options.startDate)
      .lte("transaction_time", options.endDate);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  return data;
}

export async function getRecentTransactions(limit: number = 10) {
  const client = getSupabaseClient();

  // Fetch recent transactions with all details
  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("*")
    .order("transaction_time", { ascending: false })
    .limit(limit);

  if (transactionError) {
    throw new Error("Failed to fetch transactions: " + transactionError.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      quantity_sold: txn.quantity,
      price_sold_at: txn.unit_price,
      total_value: txn.total_amount,
      minutes_ago: Math.floor((new Date().getTime() - new Date(txn.transaction_time as string).getTime()) / (1000 * 60))
    };
  });
}

// ===== TRANSACTION ANALYTICS FUNCTIONS =====

export async function getTransactionsByDateRange(startDate: string, endDate: string) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .gte("transaction_time", startDate)
    .lte("transaction_time", endDate)
    .order("transaction_time", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      days_ago: Math.floor((new Date().getTime() - new Date(txn.transaction_time as string).getTime()) / (1000 * 60 * 60 * 24))
    };
  });
}

export async function getTransactionsByProduct(productId: string) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .eq("product_id", productId)
    .order("transaction_time", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .eq("id", productId);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  const product = products?.[0];

  // Enrich the transactions with detailed information
  return transactions.map(txn => ({
    ...txn,
    product_name: product?.name || 'Unknown Product',
    product_sku: product?.sku || 'N/A',
    product_price: product?.selling_price || 0,
    formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
    formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
    formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
    location: txn.customer_location || 'Unknown Location',
    quantity_sold: txn.quantity,
    price_sold_at: txn.unit_price,
    total_value: txn.total_amount,
    days_ago: Math.floor((new Date().getTime() - new Date(txn.transaction_time as string).getTime()) / (1000 * 60 * 60 * 24))
  }));
}

export async function getHighValueTransactions(minAmount: number = 1000) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .gte("total_amount", minAmount)
    .order("total_amount", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch high-value transactions: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    const totalAmount = txn.total_amount as number;
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      value_category: totalAmount >= 5000 ? 'Premium' : 
                     totalAmount >= 2000 ? 'High Value' : 'Standard High',
      profit_potential: product?.selling_price ? 
        ((txn.unit_price as number) - (product.selling_price as number)) * (txn.quantity as number) : 0
    };
  });
}

export async function getLowValueTransactions(maxAmount: number = 50) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("transactions")
    .select("id, product_id, quantity, unit_price, total_amount, transaction_time, customer_location")
    .lte("total_amount", maxAmount)
    .order("total_amount", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch low-value transactions: " + error.message);
  }

  return data ?? [];
}

export async function getTransactionsByLocation(location: string) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .ilike("customer_location", `%${location}%`)
    .order("transaction_time", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch transactions by location: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      quantity_sold: txn.quantity,
      price_sold_at: txn.unit_price,
      total_value: txn.total_amount,
      location_match: (txn.customer_location as string)?.toLowerCase().includes(location.toLowerCase()) || false
    };
  });
}

export async function getBulkTransactions(minQuantity: number = 10) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .gte("quantity", minQuantity)
    .order("quantity", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch bulk transactions: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      quantity_sold: txn.quantity,
      price_sold_at: txn.unit_price,
      total_value: txn.total_amount,
      is_bulk_order: (txn.quantity as number) >= minQuantity,
      bulk_discount_eligible: (txn.quantity as number) >= 20
    };
  });
}

export async function getTransactionsByAmountRange(minAmount: number, maxAmount: number) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .gte("total_amount", minAmount)
    .lte("total_amount", maxAmount)
    .order("total_amount", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch transactions by amount range: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    const amount = txn.total_amount as number;
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      quantity_sold: txn.quantity,
      price_sold_at: txn.unit_price,
      total_value: txn.total_amount,
      amount_category: amount >= (minAmount + maxAmount) / 2 ? 'High Range' : 'Low Range',
      within_range: amount >= minAmount && amount <= maxAmount
    };
  });
}

export async function getTodaysTransactions() {
  const client = getSupabaseClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await client
    .from("transactions")
    .select("id, product_id, quantity, unit_price, total_amount, transaction_time, customer_location")
    .gte("transaction_time", today.toISOString())
    .lt("transaction_time", tomorrow.toISOString())
    .order("transaction_time", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch today's transactions: " + error.message);
  }

  return data ?? [];
}

export async function getWeeklyTransactions() {
  const client = getSupabaseClient();
  
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data, error } = await client
    .from("transactions")
    .select("id, product_id, quantity, unit_price, total_amount, transaction_time, customer_location")
    .gte("transaction_time", startOfWeek.toISOString())
    .order("transaction_time", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch weekly transactions: " + error.message);
  }

  return data ?? [];
}

export async function getMonthlyTransactions() {
  const client = getSupabaseClient();
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const { data, error } = await client
    .from("transactions")
    .select("id, product_id, quantity, unit_price, total_amount, transaction_time, customer_location")
    .gte("transaction_time", startOfMonth.toISOString())
    .order("transaction_time", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch monthly transactions: " + error.message);
  }

  return data ?? [];
}

// ===== SALES ANALYTICS FUNCTIONS =====

export async function getDailySalesReport(date?: string) {
  const client = getSupabaseClient();
  
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const { data, error } = await client
    .from("transactions")
    .select("quantity, total_amount")
    .gte("transaction_time", targetDate.toISOString())
    .lt("transaction_time", nextDay.toISOString());

  if (error) {
    throw new Error("Failed to fetch daily sales: " + error.message);
  }

  const totalRevenue = data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const totalQuantity = data?.reduce((sum, txn) => sum + (txn.quantity as number), 0) || 0;
  const transactionCount = data?.length || 0;

  return {
    date: targetDate.toISOString().split('T')[0],
    total_revenue: totalRevenue,
    total_quantity: totalQuantity,
    transaction_count: transactionCount,
    average_transaction_value: transactionCount > 0 ? totalRevenue / transactionCount : 0
  };
}

export async function getWeeklySalesReport() {
  const client = getSupabaseClient();
  
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data, error } = await client
    .from("transactions")
    .select("quantity, total_amount, transaction_time")
    .gte("transaction_time", startOfWeek.toISOString());

  if (error) {
    throw new Error("Failed to fetch weekly sales: " + error.message);
  }

  const totalRevenue = data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const totalQuantity = data?.reduce((sum, txn) => sum + (txn.quantity as number), 0) || 0;
  const transactionCount = data?.length || 0;

  return {
    week_start: startOfWeek.toISOString().split('T')[0],
    total_revenue: totalRevenue,
    total_quantity: totalQuantity,
    transaction_count: transactionCount,
    average_transaction_value: transactionCount > 0 ? totalRevenue / transactionCount : 0
  };
}

export async function getMonthlySalesReport() {
  const client = getSupabaseClient();
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const { data, error } = await client
    .from("transactions")
    .select("quantity, total_amount, transaction_time")
    .gte("transaction_time", startOfMonth.toISOString());

  if (error) {
    throw new Error("Failed to fetch monthly sales: " + error.message);
  }

  const totalRevenue = data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const totalQuantity = data?.reduce((sum, txn) => sum + (txn.quantity as number), 0) || 0;
  const transactionCount = data?.length || 0;

  return {
    month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
    total_revenue: totalRevenue,
    total_quantity: totalQuantity,
    transaction_count: transactionCount,
    average_transaction_value: transactionCount > 0 ? totalRevenue / transactionCount : 0
  };
}

export async function getSalesVelocity(productId?: string, days: number = 30) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = client
    .from("transactions")
    .select("product_id, quantity, total_amount, transaction_time")
    .gte("transaction_time", startDate.toISOString());

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to fetch sales velocity: " + error.message);
  }

  if (productId) {
    const totalQuantity = data?.reduce((sum, txn) => sum + (txn.quantity as number), 0) || 0;
    const totalRevenue = data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
    
    return {
      product_id: productId,
      period_days: days,
      total_quantity_sold: totalQuantity,
      total_revenue: totalRevenue,
      daily_avg_quantity: totalQuantity / days,
      daily_avg_revenue: totalRevenue / days
    };
  } else {
    const productSales = new Map<string, { quantity: number; revenue: number }>();
    
    for (const txn of data ?? []) {
      const pid = txn.product_id as string;
      const quantity = txn.quantity as number;
      const revenue = txn.total_amount as number;
      
      if (!productSales.has(pid)) {
        productSales.set(pid, { quantity, revenue });
      } else {
        const existing = productSales.get(pid)!;
        existing.quantity += quantity;
        existing.revenue += revenue;
      }
    }

    const results: Array<{
      product_id: string;
      period_days: number;
      total_quantity_sold: number;
      total_revenue: number;
      daily_avg_quantity: number;
      daily_avg_revenue: number;
    }> = [];
    
    for (const [productId, sales] of productSales.entries()) {
      results.push({
        product_id: productId,
        period_days: days,
        total_quantity_sold: sales.quantity,
        total_revenue: sales.revenue,
        daily_avg_quantity: sales.quantity / days,
        daily_avg_revenue: sales.revenue / days
      });
    }

    return results.sort((a, b) => b.total_revenue - a.total_revenue);
  }
}

export async function getTopRevenueProducts(limit: number = 10, days?: number) {
  const client = getSupabaseClient();
  
  let query = client
    .from("transactions")
    .select("product_id, quantity, total_amount");

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query = query.gte("transaction_time", startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to fetch transaction data: " + error.message);
  }

  const productRevenue = new Map<string, { quantity: number; revenue: number }>();
  
  for (const txn of data ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;
    
    if (!productRevenue.has(productId)) {
      productRevenue.set(productId, { quantity, revenue });
    } else {
      const existing = productRevenue.get(productId)!;
      existing.quantity += quantity;
      existing.revenue += revenue;
    }
  }

  // Get product details
  const productIds = Array.from(productRevenue.keys());
  const { data: products } = await client
    .from("products")
    .select("id, name, sku, selling_price")
    .in("id", productIds);

  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  const results: Array<{
    product_id: string;
    product_name: any;
    product_sku: any;
    total_quantity: number;
    total_revenue: number;
    average_unit_price: number;
  }> = [];
  
  for (const [productId, sales] of productRevenue.entries()) {
    const product = productMap.get(productId);
    results.push({
      product_id: productId,
      product_name: product?.name || 'Unknown',
      product_sku: product?.sku || 'Unknown',
      total_quantity: sales.quantity,
      total_revenue: sales.revenue,
      average_unit_price: sales.quantity > 0 ? sales.revenue / sales.quantity : 0
    });
  }

  return results
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}

export async function getLocationAnalysis() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("transactions")
    .select("customer_location, quantity, total_amount");

  if (error) {
    throw new Error("Failed to fetch transaction data: " + error.message);
  }

  const locationStats = new Map<string, {
    transaction_count: number;
    total_quantity: number;
    total_revenue: number;
  }>();

  for (const txn of data ?? []) {
    const location = txn.customer_location as string || 'Unknown';
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;

    if (!locationStats.has(location)) {
      locationStats.set(location, {
        transaction_count: 1,
        total_quantity: quantity,
        total_revenue: revenue
      });
    } else {
      const existing = locationStats.get(location)!;
      existing.transaction_count += 1;
      existing.total_quantity += quantity;
      existing.total_revenue += revenue;
    }
  }

  const results: Array<{
    location: string;
    transaction_count: number;
    total_quantity: number;
    total_revenue: number;
    average_transaction_value: number;
  }> = [];
  
  for (const [location, stats] of locationStats.entries()) {
    results.push({
      location,
      transaction_count: stats.transaction_count,
      total_quantity: stats.total_quantity,
      total_revenue: stats.total_revenue,
      average_transaction_value: stats.total_revenue / stats.transaction_count
    });
  }

  return results.sort((a, b) => b.total_revenue - a.total_revenue);
}

// ===== TRANSACTION MODIFICATION FUNCTIONS =====

// ===== ADVANCED ANALYTICS FUNCTIONS =====

export async function getTransactionTrends(days: number = 30) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("transactions")
    .select("total_amount, quantity, transaction_time")
    .gte("transaction_time", startDate.toISOString())
    .order("transaction_time", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch transaction trends: " + error.message);
  }

  // Group by day
  const dailyStats = new Map<string, {
    revenue: number;
    quantity: number;
    count: number;
  }>();

  for (const txn of data ?? []) {
    const date = new Date(txn.transaction_time as string).toISOString().split('T')[0];
    const revenue = txn.total_amount as number;
    const quantity = txn.quantity as number;

    if (!dailyStats.has(date)) {
      dailyStats.set(date, { revenue, quantity, count: 1 });
    } else {
      const existing = dailyStats.get(date)!;
      existing.revenue += revenue;
      existing.quantity += quantity;
      existing.count += 1;
    }
  }

  const results: Array<{
    date: string;
    total_revenue: number;
    total_quantity: number;
    transaction_count: number;
    average_transaction_value: number;
  }> = [];
  
  for (const [date, stats] of dailyStats.entries()) {
    results.push({
      date,
      total_revenue: stats.revenue,
      total_quantity: stats.quantity,
      transaction_count: stats.count,
      average_transaction_value: stats.revenue / stats.count
    });
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTransactionFrequencyAnalysis() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("transactions")
    .select("transaction_time");

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  const hourlyFrequency = new Array(24).fill(0);
  const dailyFrequency = new Array(7).fill(0);
  const monthlyFrequency = new Array(12).fill(0);

  for (const txn of data ?? []) {
    const date = new Date(txn.transaction_time as string);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    const month = date.getMonth();

    hourlyFrequency[hour]++;
    dailyFrequency[dayOfWeek]++;
    monthlyFrequency[month]++;
  }

  return {
    hourly_distribution: hourlyFrequency.map((count, hour) => ({ hour, count })),
    daily_distribution: dailyFrequency.map((count, day) => ({ 
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day], 
      count 
    })),
    monthly_distribution: monthlyFrequency.map((count, month) => ({ 
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month], 
      count 
    }))
  };
}

export async function getAverageTransactionValue(days?: number) {
  const client = getSupabaseClient();

  let query = client
    .from("transactions")
    .select("total_amount");

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query = query.gte("transaction_time", startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  const totalRevenue = data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const transactionCount = data?.length || 0;

  return {
    average_transaction_value: transactionCount > 0 ? totalRevenue / transactionCount : 0,
    total_revenue: totalRevenue,
    transaction_count: transactionCount,
    period_days: days || 'all_time'
  };
}

export async function getTransactionsByQuantityRange(minQuantity: number, maxQuantity: number) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .gte("quantity", minQuantity)
    .lte("quantity", maxQuantity)
    .order("quantity", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch transactions by quantity range: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    const quantity = txn.quantity as number;
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      quantity_sold: txn.quantity,
      price_sold_at: txn.unit_price,
      total_value: txn.total_amount,
      quantity_category: quantity >= (minQuantity + maxQuantity) / 2 ? 'High Quantity' : 'Low Quantity',
      within_range: quantity >= minQuantity && quantity <= maxQuantity
    };
  });
}

export async function getPeakSalesHours() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("transactions")
    .select("transaction_time, total_amount");

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  const hourlyRevenue = new Array(24).fill(0);
  const hourlyCount = new Array(24).fill(0);

  for (const txn of data ?? []) {
    const hour = new Date(txn.transaction_time as string).getHours();
    hourlyRevenue[hour] += txn.total_amount as number;
    hourlyCount[hour]++;
  }

  const results = hourlyRevenue.map((revenue, hour) => ({
    hour,
    total_revenue: revenue,
    transaction_count: hourlyCount[hour],
    average_transaction_value: hourlyCount[hour] > 0 ? revenue / hourlyCount[hour] : 0
  }));

  return results.sort((a, b) => b.total_revenue - a.total_revenue);
}

export async function getCustomerSegmentAnalysis() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("transactions")
    .select("customer_location, total_amount, quantity");

  if (error) {
    throw new Error("Failed to fetch transactions: " + error.message);
  }

  const segments = {
    high_value: [] as any[],
    medium_value: [] as any[],
    low_value: [] as any[]
  };

  for (const txn of data ?? []) {
    const amount = txn.total_amount as number;
    if (amount >= 500) {
      segments.high_value.push(txn);
    } else if (amount >= 100) {
      segments.medium_value.push(txn);
    } else {
      segments.low_value.push(txn);
    }
  }

  return {
    high_value_customers: {
      count: segments.high_value.length,
      total_revenue: segments.high_value.reduce((sum, txn) => sum + (txn.total_amount as number), 0),
      average_transaction_value: segments.high_value.length > 0 ? 
        segments.high_value.reduce((sum, txn) => sum + (txn.total_amount as number), 0) / segments.high_value.length : 0
    },
    medium_value_customers: {
      count: segments.medium_value.length,
      total_revenue: segments.medium_value.reduce((sum, txn) => sum + (txn.total_amount as number), 0),
      average_transaction_value: segments.medium_value.length > 0 ? 
        segments.medium_value.reduce((sum, txn) => sum + (txn.total_amount as number), 0) / segments.medium_value.length : 0
    },
    low_value_customers: {
      count: segments.low_value.length,
      total_revenue: segments.low_value.reduce((sum, txn) => sum + (txn.total_amount as number), 0),
      average_transaction_value: segments.low_value.length > 0 ? 
        segments.low_value.reduce((sum, txn) => sum + (txn.total_amount as number), 0) / segments.low_value.length : 0
    }
  };
}

// ===== SEARCH AND FILTER FUNCTIONS =====

export async function advancedTransactionSearch(filters: {
  productId?: string;
  minAmount?: number;
  maxAmount?: number;
  minQuantity?: number;
  maxQuantity?: number;
  location?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const client = getSupabaseClient();

  let query = client
    .from("transactions")
    .select("id, product_id, quantity, unit_price, total_amount, transaction_time, customer_location");

  if (filters.productId) {
    query = query.eq("product_id", filters.productId);
  }
  if (filters.minAmount !== undefined) {
    query = query.gte("total_amount", filters.minAmount);
  }
  if (filters.maxAmount !== undefined) {
    query = query.lte("total_amount", filters.maxAmount);
  }
  if (filters.minQuantity !== undefined) {
    query = query.gte("quantity", filters.minQuantity);
  }
  if (filters.maxQuantity !== undefined) {
    query = query.lte("quantity", filters.maxQuantity);
  }
  if (filters.location) {
    query = query.ilike("customer_location", `%${filters.location}%`);
  }
  if (filters.startDate) {
    query = query.gte("transaction_time", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("transaction_time", filters.endDate);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  query = query.order("transaction_time", { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to search transactions: " + error.message);
  }

  return data ?? [];
}

// ===== COMPREHENSIVE ANALYSIS FUNCTIONS =====

export async function getComprehensiveTransactionAnalysis(days: number = 30) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("transactions")
    .select("product_id, quantity, unit_price, total_amount, transaction_time, customer_location")
    .gte("transaction_time", startDate.toISOString());

  if (error) {
    throw new Error("Failed to fetch comprehensive transaction data: " + error.message);
  }

  const totalRevenue = data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const totalQuantity = data?.reduce((sum, txn) => sum + (txn.quantity as number), 0) || 0;
  const transactionCount = data?.length || 0;
  const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
  const averageQuantityPerTransaction = transactionCount > 0 ? totalQuantity / transactionCount : 0;

  // Get unique products and locations
  const uniqueProducts = new Set(data?.map(txn => txn.product_id as string) ?? []);
  const uniqueLocations = new Set(data?.map(txn => txn.customer_location as string) ?? []);

  // Find highest and lowest transactions
  const sortedByAmount = [...(data ?? [])].sort((a, b) => (b.total_amount as number) - (a.total_amount as number));
  const highestTransaction = sortedByAmount[0];
  const lowestTransaction = sortedByAmount[sortedByAmount.length - 1];

  return {
    period_days: days,
    summary: {
      total_revenue: totalRevenue,
      total_quantity: totalQuantity,
      transaction_count: transactionCount,
      average_transaction_value: averageTransactionValue,
      average_quantity_per_transaction: averageQuantityPerTransaction,
      unique_products_sold: uniqueProducts.size,
      unique_locations_served: uniqueLocations.size
    },
    extremes: {
      highest_transaction: {
        amount: highestTransaction?.total_amount || 0,
        quantity: highestTransaction?.quantity || 0,
        location: highestTransaction?.customer_location || 'Unknown',
        date: highestTransaction?.transaction_time || null
      },
      lowest_transaction: {
        amount: lowestTransaction?.total_amount || 0,
        quantity: lowestTransaction?.quantity || 0,
        location: lowestTransaction?.customer_location || 'Unknown',
        date: lowestTransaction?.transaction_time || null
      }
    }
  };
}

export async function getTransactionPerformanceMetrics() {
  const client = getSupabaseClient();

  // Get data for different time periods
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Get today's data
  const todayData = await getDailySalesReport();
  
  // Get yesterday's data
  const yesterdayData = await getDailySalesReport(yesterday.toISOString().split('T')[0]);
  
  // Get week-over-week data
  const thisWeekData = await getWeeklySalesReport();
  
  // Calculate growth rates
  const dailyGrowth = yesterdayData.total_revenue > 0 ? 
    ((todayData.total_revenue - yesterdayData.total_revenue) / yesterdayData.total_revenue) * 100 : 0;

  return {
    current_performance: {
      today: todayData,
      yesterday: yesterdayData,
      this_week: thisWeekData
    },
    growth_metrics: {
      daily_revenue_growth_percent: dailyGrowth,
      daily_transaction_growth_percent: yesterdayData.transaction_count > 0 ? 
        ((todayData.transaction_count - yesterdayData.transaction_count) / yesterdayData.transaction_count) * 100 : 0
    }
  };
}

// ===== ADDITIONAL UTILITY FUNCTIONS =====

export async function getAllTransactions(limit?: number) {
  const client = getSupabaseClient();
  
  let query = client
    .from("transactions")
    .select("*")
    .order("transaction_time", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: transactions, error } = await query;

  if (error) {
    throw new Error("Failed to fetch all transactions: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      profit_margin: product?.selling_price ? 
        (((txn.unit_price as number) - (product.selling_price as number)) / (product.selling_price as number) * 100) : 0
    };
  });
}

export async function getTransactionById(id: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error("Failed to fetch transaction by ID: " + error.message);
  }

  return data;
}

export async function getDailySales(days: number = 30) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("transactions")
    .select("total_amount, transaction_time")
    .gte("transaction_time", startDate.toISOString())
    .order("transaction_time", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch daily sales: " + error.message);
  }

  // Group by day
  const dailySales = new Map<string, { total_sales: number; transaction_count: number }>();
  
  for (const txn of data ?? []) {
    const date = new Date(txn.transaction_time as string).toISOString().split('T')[0];
    const amount = txn.total_amount as number;
    
    if (!dailySales.has(date)) {
      dailySales.set(date, { total_sales: amount, transaction_count: 1 });
    } else {
      const existing = dailySales.get(date)!;
      existing.total_sales += amount;
      existing.transaction_count += 1;
    }
  }

  return Array.from(dailySales.entries()).map(([date, stats]) => ({
    date,
    ...stats
  }));
}

export async function getWeeklySales(weeks: number = 4) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));

  const { data, error } = await client
    .from("transactions")
    .select("total_amount, transaction_time")
    .gte("transaction_time", startDate.toISOString())
    .order("transaction_time", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch weekly sales: " + error.message);
  }

  // Group by week
  const weeklySales = new Map<string, { total_sales: number; transaction_count: number }>();
  
  for (const txn of data ?? []) {
    const date = new Date(txn.transaction_time as string);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    const amount = txn.total_amount as number;
    
    if (!weeklySales.has(weekKey)) {
      weeklySales.set(weekKey, { total_sales: amount, transaction_count: 1 });
    } else {
      const existing = weeklySales.get(weekKey)!;
      existing.total_sales += amount;
      existing.transaction_count += 1;
    }
  }

  return Array.from(weeklySales.entries()).map(([week_start, stats]) => ({
    week_start,
    ...stats
  }));
}

export async function getMonthlySales(months: number = 6) {
  const client = getSupabaseClient();
  
  const startDate = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - months);

  const { data, error } = await client
    .from("transactions")
    .select("total_amount, transaction_time")
    .gte("transaction_time", monthAgo.toISOString())
    .order("transaction_time", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch monthly sales: " + error.message);
  }

  // Group by month
  const monthlySales = new Map<string, { total_sales: number; transaction_count: number }>();
  
  for (const txn of data ?? []) {
    const date = new Date(txn.transaction_time as string);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const amount = txn.total_amount as number;
    
    if (!monthlySales.has(monthKey)) {
      monthlySales.set(monthKey, { total_sales: amount, transaction_count: 1 });
    } else {
      const existing = monthlySales.get(monthKey)!;
      existing.total_sales += amount;
      existing.transaction_count += 1;
    }
  }

  return Array.from(monthlySales.entries()).map(([month, stats]) => ({
    month,
    ...stats
  }));
}

export async function getSalesTrends(days: number = 30) {
  const dailySales = await getDailySales(days);
  
  if (dailySales.length === 0) {
    return {
      growth_rate: 0,
      average_daily_sales: 0,
      peak_day: null,
      trend: 'stable'
    };
  }

  const totalSales = dailySales.reduce((sum, day) => sum + day.total_sales, 0);
  const averageDailySales = totalSales / dailySales.length;

  // Find peak day
  const peakDay = dailySales.reduce((max, day) => 
    day.total_sales > max.total_sales ? day : max
  );

  // Calculate growth rate (comparing first half to second half)
  const midpoint = Math.floor(dailySales.length / 2);
  const firstHalfAvg = dailySales.slice(0, midpoint).reduce((sum, day) => sum + day.total_sales, 0) / midpoint;
  const secondHalfAvg = dailySales.slice(midpoint).reduce((sum, day) => sum + day.total_sales, 0) / (dailySales.length - midpoint);
  
  const growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  return {
    growth_rate: growthRate,
    average_daily_sales: averageDailySales,
    peak_day: {
      date: peakDay.date,
      sales: peakDay.total_sales
    },
    trend: growthRate > 5 ? 'growing' : growthRate < -5 ? 'declining' : 'stable'
  };
}

export async function getTopSellingProducts(limit: number = 10, days?: number) {
  const client = getSupabaseClient();
  
  let query = client
    .from("transactions")
    .select("product_id, quantity, total_amount, transaction_time, customer_location");

  if (days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query = query.gte("transaction_time", startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to fetch top selling products: " + error.message);
  }

  // Group by product
  const productStats = new Map<string, { 
    total_quantity: number; 
    total_revenue: number; 
    transaction_count: number;
    locations: Set<string>;
    last_sold: string;
    first_sold: string;
  }>();
  
  for (const txn of data ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;
    const location = txn.customer_location as string || 'Unknown';
    const transactionTime = txn.transaction_time as string;
    
    if (!productStats.has(productId)) {
      productStats.set(productId, { 
        total_quantity: quantity, 
        total_revenue: revenue, 
        transaction_count: 1,
        locations: new Set([location]),
        last_sold: transactionTime,
        first_sold: transactionTime
      });
    } else {
      const existing = productStats.get(productId)!;
      existing.total_quantity += quantity;
      existing.total_revenue += revenue;
      existing.transaction_count += 1;
      existing.locations.add(location);
      
      // Update first and last sold dates
      if (new Date(transactionTime) > new Date(existing.last_sold)) {
        existing.last_sold = transactionTime;
      }
      if (new Date(transactionTime) < new Date(existing.first_sold)) {
        existing.first_sold = transactionTime;
      }
    }
  }

  // Get unique product IDs
  const productIds = Array.from(productStats.keys());

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  const results = Array.from(productStats.entries()).map(([product_id, stats]) => {
    const product = productMap.get(product_id);
    return {
      product_id,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      category_id: product?.category_id || null,
      total_quantity: stats.total_quantity,
      total_revenue: stats.total_revenue,
      transaction_count: stats.transaction_count,
      average_quantity_per_transaction: stats.total_quantity / stats.transaction_count,
      average_revenue_per_transaction: stats.total_revenue / stats.transaction_count,
      locations_sold: Array.from(stats.locations),
      unique_locations_count: stats.locations.size,
      last_sold_date: new Date(stats.last_sold).toLocaleDateString(),
      last_sold_time: new Date(stats.last_sold).toLocaleString(),
      first_sold_date: new Date(stats.first_sold).toLocaleDateString(),
      days_selling: days ? Math.ceil((new Date(stats.last_sold).getTime() - new Date(stats.first_sold).getTime()) / (1000 * 60 * 60 * 24)) : 'N/A'
    };
  });

  return results
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit);
}

export async function getTransactionVelocity() {
  const client = getSupabaseClient();
  
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Get counts for different periods
  const [todayCount, weekCount, monthCount] = await Promise.all([
    client.from("transactions").select("id", { count: 'exact' }).gte("transaction_time", today.toISOString()),
    client.from("transactions").select("id", { count: 'exact' }).gte("transaction_time", weekAgo.toISOString()),
    client.from("transactions").select("id", { count: 'exact' }).gte("transaction_time", monthAgo.toISOString())
  ]);

  return {
    today: todayCount.count || 0,
    this_week: weekCount.count || 0,
    this_month: monthCount.count || 0,
    daily_average: (monthCount.count || 0) / 30
  };
}

export async function getSalesFrequency() {
  const topProducts = await getTopSellingProducts(50);
  
  const high_frequency = topProducts.filter(p => p.total_quantity >= 20);
  const medium_frequency = topProducts.filter(p => p.total_quantity >= 10 && p.total_quantity < 20);
  const low_frequency = topProducts.filter(p => p.total_quantity < 10);

  return {
    high_frequency,
    medium_frequency,
    low_frequency
  };
}

export async function getLowQuantityTransactions(maxQuantity: number = 2) {
  const client = getSupabaseClient();

  const { data: transactions, error } = await client
    .from("transactions")
    .select("*")
    .lte("quantity", maxQuantity)
    .order("transaction_time", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch low quantity transactions: " + error.message);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get unique product IDs
  const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

  // Fetch product details
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, category_id")
    .in("id", productIds);

  if (productError) {
    console.warn("Failed to fetch product details:", productError.message);
  }

  // Create a map for quick product lookup
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

  // Enrich the transactions with detailed information
  return transactions.map(txn => {
    const product = productMap.get(txn.product_id as string);
    const quantity = txn.quantity as number;
    return {
      ...txn,
      product_name: product?.name || 'Unknown Product',
      product_sku: product?.sku || 'N/A',
      product_price: product?.selling_price || 0,
      formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
      formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
      formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
      location: txn.customer_location || 'Unknown Location',
      quantity_sold: txn.quantity,
      price_sold_at: txn.unit_price,
      total_value: txn.total_amount,
      is_small_order: quantity <= maxQuantity,
      potential_upsell: quantity === 1 // Single item purchases might be good for upselling
    };
  });
}

export async function searchTransactions(searchTerm: string, limit: number = 50) {
  const client = getSupabaseClient();

  // Use a simpler approach - search only in customer_location field
  try {
    const { data: transactions, error } = await client
      .from("transactions")
      .select("*")
      .ilike("customer_location", `%${searchTerm}%`)
      .order("transaction_time", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error("Database search failed: " + error.message);
    }

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Get unique product IDs
    const productIds = [...new Set(transactions.map(txn => txn.product_id as string))];

    // Fetch product details
    const { data: products, error: productError } = await client
      .from("products")
      .select("id, name, sku, selling_price, category_id")
      .in("id", productIds);

    if (productError) {
      console.warn("Failed to fetch product details:", productError.message);
    }

    // Create a map for quick product lookup
    const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);

    // Enrich the transactions with detailed information
    return transactions.map(txn => {
      const product = productMap.get(txn.product_id as string);
      return {
        ...txn,
        product_name: product?.name || 'Unknown Product',
        product_sku: product?.sku || 'N/A',
        product_price: product?.selling_price || 0,
        formatted_date: new Date(txn.transaction_time as string).toLocaleDateString(),
        formatted_time: new Date(txn.transaction_time as string).toLocaleTimeString(),
        formatted_datetime: new Date(txn.transaction_time as string).toLocaleString(),
        location: txn.customer_location || 'Unknown Location',
        search_matched_field: 'location' // Indicates which field matched the search
      };
    });

  } catch (dbError) {
    console.warn("Database search failed, attempting fallback search:", dbError);
    
    // Fallback: Get all transactions and filter manually
    const { data, error } = await client
      .from("transactions")
      .select("*")
      .order("transaction_time", { ascending: false })
      .limit(1000); // Reasonable limit for fallback

    if (error) {
      throw new Error("Failed to search transactions: " + error.message);
    }

    // Filter results manually
    const filteredData = (data ?? []).filter(txn => {
      const productId = String(txn.product_id || '').toLowerCase();
      const location = String(txn.customer_location || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return productId.includes(searchLower) || location.includes(searchLower);
    });

    return filteredData.slice(0, limit);
  }
}

export async function getTransactionDashboardStats() {
  const client = getSupabaseClient();
  
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Get sales for different periods
  const [todaySales, weekSales, monthSales] = await Promise.all([
    client.from("transactions").select("total_amount").gte("transaction_time", today.toISOString()),
    client.from("transactions").select("total_amount").gte("transaction_time", weekAgo.toISOString()),
    client.from("transactions").select("total_amount").gte("transaction_time", monthAgo.toISOString())
  ]);

  const todayTotal = todaySales.data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const weekTotal = weekSales.data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const monthTotal = monthSales.data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;

  // Calculate growth rate (week over week)
  const lastWeekStart = new Date(weekAgo);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const lastWeekSales = await client
    .from("transactions")
    .select("total_amount")
    .gte("transaction_time", lastWeekStart.toISOString())
    .lt("transaction_time", weekAgo.toISOString());

  const lastWeekTotal = lastWeekSales.data?.reduce((sum, txn) => sum + (txn.total_amount as number), 0) || 0;
  const growthRate = lastWeekTotal > 0 ? ((weekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;

  return {
    quick_stats: {
      today_sales: todayTotal,
      week_sales: weekTotal,
      month_sales: monthTotal,
      growth_rate: growthRate
    }
  };
}

