import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase environment variables.");
    }
    supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

export async function getTopSellingProducts(limit = 5) {
  const client = getSupabaseClient();

  // First, let's get the transaction data with product IDs
  const { data: transactionData, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity")
    .order("quantity", { ascending: false });

  if (transactionError) {
    throw new Error("Failed to fetch transactions: " + transactionError.message);
  }

  // Get unique product IDs
  const productIds = [...new Set(transactionData?.map(t => t.product_id as string) ?? [])];

  // Get product details
  const { data: productData, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price")
    .in("id", productIds);

  if (productError) {
    throw new Error("Failed to fetch products: " + productError.message);
  }

  // Create a map of product details
  const productMap = new Map(
    productData?.map(p => [p.id as string, p]) ?? []
  );

  // Group quantities by product
  const grouped = new Map<string, {
    name: string;
    sku: string;
    selling_price: number;
    total_quantity: number;
  }>();

  for (const txn of transactionData ?? []) {
    const id = txn.product_id as string;
    const quantity = txn.quantity as number;
    const product = productMap.get(id);

    if (!product) continue; // Skip if product not found

    if (!grouped.has(id)) {
      grouped.set(id, {
        name: product.name as string,
        sku: product.sku as string,
        selling_price: product.selling_price as number,
        total_quantity: quantity,
      });
    } else {
      const existing = grouped.get(id)!;
      existing.total_quantity += quantity;
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, limit);
}

export async function listOutOfStockProducts() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock")
    .eq("current_stock", 0);

  if (error) {
    throw new Error("Failed to fetch out-of-stock products: " + error.message);
  }

  return data ?? [];
}

export async function getProductStockValue(productId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("current_stock, selling_price")
    .eq("id", productId)
    .single();

  if (error) {
    throw new Error("Failed to fetch product: " + error.message);
  }

  const stockValue = (data.current_stock as number) * (data.selling_price as number);
  return stockValue;
}

export async function getTotalStockValue() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("current_stock, selling_price");

  if (error) {
    throw new Error("Failed to fetch products: " + error.message);
  }

  const totalValue = data?.reduce((sum, product) => {
    return sum + ((product.current_stock as number) * (product.selling_price as number));
  }, 0) || 0;

  return totalValue;
}

export async function listProductsByCategory(categoryId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price")
    .eq("category_id", categoryId);

  if (error) {
    throw new Error("Failed to fetch products by category: " + error.message);
  }

  return data ?? [];
}

export async function getProductDetails(productId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price")
    .eq("id", productId)
    .single();

  if (error) {
    throw new Error("Failed to fetch product details: " + error.message);
  }

  return data;
}

export async function listProductsByCompany(companyId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price")
    .eq("company_id", companyId);

  if (error) {
    throw new Error("Failed to fetch products by company: " + error.message);
  }

  return data ?? [];
}


export async function listLowStockProducts(threshold: number) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock")
    .lt("current_stock", threshold);

  if (error) {
    throw new Error("Failed to fetch low-stock products: " + error.message);
  }

  return data ?? [];
}

export async function listProductsByCompanyName(companyName: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price, companies(name)")
    .eq("companies.name", companyName);

  if (error) {
    throw new Error("Failed to fetch products for company: " + error.message);
  }

  return data ?? [];
}

export async function listLowStockProductsByCategory(categoryName: string, threshold: number) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price, categories(name)")
    .lte("current_stock", threshold)
    .eq("categories.name", categoryName);

  if (error) {
    throw new Error("Failed to fetch low stock products for category: " + error.message);
  }

  return data ?? [];
}

export async function listExpensiveProducts(minPrice: number = 500) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price")
    .gt("selling_price", minPrice);

  if (error) {
    throw new Error("Failed to fetch expensive products: " + error.message);
  }

  return data ?? [];
}

export async function listCheapProducts(maxPrice: number = 100) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price")
    .lt("selling_price", maxPrice);

  if (error) {
    throw new Error("Failed to fetch cheap products: " + error.message);
  }

  return data ?? [];
}


export async function listProductsByStockRange(min: number, max: number) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price")
    .gte("current_stock", min)
    .lte("current_stock", max);

  if (error) {
    throw new Error("Failed to fetch products by stock range: " + error.message);
  }

  return data ?? [];
}


export async function searchProductsByName(keyword: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price")
    .ilike("name", `%${keyword}%`);

  if (error) throw new Error("Failed to search products: " + error.message);

  return data ?? [];
}

export async function listProductsAbovePrice(price: number) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, selling_price")
    .gt("selling_price", price);

  if (error) throw new Error("Failed to fetch products: " + error.message);

  return data ?? [];
}


export async function listProductsByCategoryName(categoryName: string) {
  const client = getSupabaseClient();

  const { data: categories, error: categoryError } = await client
    .from("categories")
    .select("id")
    .ilike("name", `%${categoryName}%`)
    .limit(1);

  if (categoryError || !categories?.length) {
    throw new Error("Category not found or failed to fetch.");
  }

  return await listProductsByCategory(categories[0].id as string);
}

export async function getProductProfitMargin(productId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("cost_price, selling_price")
    .eq("id", productId)
    .single();

  if (error) throw new Error("Failed to fetch product: " + error.message);

  const cost = data.cost_price as number;
  const selling = data.selling_price as number;

  if (!cost || cost === 0) return null;

  const margin = ((selling - cost) / cost) * 100;
  return margin; // in percent
}

export async function getStockValueByCategory(categoryId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("current_stock, selling_price")
    .eq("category_id", categoryId);

  if (error) throw new Error("Failed to fetch products by category: " + error.message);

  const totalValue = data?.reduce((sum, p) => {
    return sum + ((p.current_stock as number) * (p.selling_price as number));
  }, 0) ?? 0;

  return totalValue;
}
export async function getProductSalesData(productName: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("transactions")
    .select("quantity, unit_price, transaction_time")
    .eq("product_name", productName)
    .order("transaction_time", { ascending: false });

  if (error) throw new Error("Failed to fetch sales data: " + error.message);

  return data ?? [];
}

export async function getHighestStockValueProduct() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price");

  if (error) throw new Error("Failed to fetch products: " + error.message);

  let highest: any = null;
  let maxValue = 0;

  for (const p of data ?? []) {
    const value = (p.current_stock as number) * (p.selling_price as number);
    if (value > maxValue) {
      maxValue = value;
      highest = p;
    }
  }

  return highest;
}


export async function getAverageSellingPriceByCategory() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("category_id, selling_price");

  if (error) throw new Error("Failed to fetch products: " + error.message);

  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const p of data ?? []) {
    const id = p.category_id as string;
    const price = p.selling_price as number;

    if (!categoryMap.has(id)) {
      categoryMap.set(id, { total: price, count: 1 });
    } else {
      const record = categoryMap.get(id)!;
      record.total += price;
      record.count += 1;
    }
  }

  const result: { category_id: string; average_price: number }[] = [];
  for (const [categoryId, { total, count }] of categoryMap.entries()) {
    result.push({ category_id: categoryId, average_price: total / count });
  }

  return result;
}

export async function getTotalStockQuantityByCompany(companyId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("current_stock")
    .eq("company_id", companyId);

  if (error) throw new Error("Failed to fetch products: " + error.message);

  return data?.reduce((sum, p) => sum + (p.current_stock as number), 0) ?? 0;
}

// ===== PRODUCT MODIFICATION FUNCTIONS =====

export async function updateProductStock(productId: string, newStock: number) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .update({ current_stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select();

  if (error) throw new Error("Failed to update product stock: " + error.message);
  return data;
}

export async function updateProductPrice(productId: string, newPrice: number) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .update({ selling_price: newPrice, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select();

  if (error) throw new Error("Failed to update product price: " + error.message);
  return data;
}

export async function addProduct(product: {
  name: string;
  sku: string;
  company_id: string;
  category_id: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  description?: string;
}) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .insert([product])
    .select();

  if (error) throw new Error("Failed to add product: " + error.message);
  return data;
}

export async function deleteProduct(productId: string) {
  const client = getSupabaseClient();

  const { error } = await client
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw new Error("Failed to delete product: " + error.message);
  return true;
}

export async function adjustStock(productId: string, quantity: number, operation: 'add' | 'subtract') {
  const client = getSupabaseClient();

  // First get current stock
  const { data: product, error: fetchError } = await client
    .from("products")
    .select("current_stock")
    .eq("id", productId)
    .single();

  if (fetchError) throw new Error("Failed to fetch product: " + fetchError.message);

  const currentStock = product.current_stock as number;
  const newStock = operation === 'add' ? currentStock + quantity : currentStock - quantity;

  if (newStock < 0) throw new Error("Cannot reduce stock below zero");

  return await updateProductStock(productId, newStock);
}

// ===== ADVANCED ANALYSIS FUNCTIONS =====

export async function getProductPerformanceAnalysis() {
  const client = getSupabaseClient();

  // Get all products with their sales data
  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, sku, selling_price, current_stock, cost_price");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get transaction data
  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount");

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  // Calculate performance metrics
  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);
  const salesMap = new Map<string, { totalSales: number; totalRevenue: number; totalProfit: number }>();

  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;
    const product = productMap.get(productId);
    
    if (!product) continue;

    const profit = revenue - ((product.cost_price as number) * quantity);

    if (!salesMap.has(productId)) {
      salesMap.set(productId, { totalSales: quantity, totalRevenue: revenue, totalProfit: profit });
    } else {
      const existing = salesMap.get(productId)!;
      existing.totalSales += quantity;
      existing.totalRevenue += revenue;
      existing.totalProfit += profit;
    }
  }

  const results: Array<{
    id: string;
    name: any;
    sku: any;
    current_stock: any;
    selling_price: any;
    total_sales: number;
    total_revenue: number;
    total_profit: number;
    profit_margin: number;
  }> = [];
  for (const [productId, sales] of salesMap.entries()) {
    const product = productMap.get(productId);
    if (product) {
      results.push({
        id: productId,
        name: product.name,
        sku: product.sku,
        current_stock: product.current_stock,
        selling_price: product.selling_price,
        total_sales: sales.totalSales,
        total_revenue: sales.totalRevenue,
        total_profit: sales.totalProfit,
        profit_margin: sales.totalRevenue > 0 ? (sales.totalProfit / sales.totalRevenue) * 100 : 0
      });
    }
  }

  return results.sort((a, b) => b.total_revenue - a.total_revenue);
}

export async function getInventoryTurnoverRate(productId?: string) {
  const client = getSupabaseClient();

  let productFilter = "";
  if (productId) {
    productFilter = `.eq("product_id", "${productId}")`;
  }

  // Get sales data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error } = await client
    .from("transactions")
    .select("product_id, quantity")
    .gte("transaction_time", thirtyDaysAgo.toISOString());

  if (error) throw new Error("Failed to fetch transactions: " + error.message);

  if (productId) {
    // Single product turnover
    const productTransactions = transactions?.filter(t => t.product_id === productId) ?? [];
    const totalSold = productTransactions.reduce((sum, t) => sum + (t.quantity as number), 0);

    const { data: product } = await client
      .from("products")
      .select("current_stock, name")
      .eq("id", productId)
      .single();

    const avgStock = (product?.current_stock as number) || 1;
    const turnoverRate = totalSold / avgStock;

    return {
      product_id: productId,
      product_name: product?.name,
      turnover_rate: turnoverRate,
      units_sold_30_days: totalSold,
      current_stock: avgStock
    };
  } else {
    // All products turnover
    const salesByProduct = new Map<string, number>();
    for (const txn of transactions ?? []) {
      const productId = txn.product_id as string;
      const quantity = txn.quantity as number;
      salesByProduct.set(productId, (salesByProduct.get(productId) || 0) + quantity);
    }

    const { data: products } = await client
      .from("products")
      .select("id, name, current_stock");

    const results: Array<{
      product_id: string;
      product_name: any;
      turnover_rate: number;
      units_sold_30_days: number;
      current_stock: number;
    }> = [];
    for (const product of products ?? []) {
      const productId = product.id as string;
      const salesVolume = salesByProduct.get(productId) || 0;
      const currentStock = (product.current_stock as number) || 1;
      const turnoverRate = salesVolume / currentStock;

      results.push({
        product_id: productId,
        product_name: product.name,
        turnover_rate: turnoverRate,
        units_sold_30_days: salesVolume,
        current_stock: currentStock
      });
    }

    return results.sort((a, b) => b.turnover_rate - a.turnover_rate);
  }
}

export async function getStockAlerts(lowStockThreshold: number = 10, highStockThreshold: number = 1000) {
  const client = getSupabaseClient();

  const { data: products, error } = await client
    .from("products")
    .select("id, name, sku, current_stock, selling_price");

  if (error) throw new Error("Failed to fetch products: " + error.message);

  const alerts = {
    low_stock: [] as any[],
    high_stock: [] as any[],
    out_of_stock: [] as any[]
  };

  for (const product of products ?? []) {
    const stock = product.current_stock as number;
    
    if (stock === 0) {
      alerts.out_of_stock.push(product);
    } else if (stock <= lowStockThreshold) {
      alerts.low_stock.push(product);
    } else if (stock >= highStockThreshold) {
      alerts.high_stock.push(product);
    }
  }

  return alerts;
}

export async function getProfitabilityReport() {
  const client = getSupabaseClient();

  const { data: products, error } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock");

  if (error) throw new Error("Failed to fetch products: " + error.message);

  const results: Array<{
    id: any;
    name: any;
    cost_price: number;
    selling_price: number;
    profit_per_unit: number;
    profit_margin_percent: number;
    current_stock: number;
    potential_profit: number;
  }> = [];
  for (const product of products ?? []) {
    const cost = product.cost_price as number;
    const selling = product.selling_price as number;
    const stock = product.current_stock as number;

    const profitPerUnit = selling - cost;
    const profitMargin = cost > 0 ? ((selling - cost) / cost) * 100 : 0;
    const potentialProfit = profitPerUnit * stock;

    results.push({
      id: product.id,
      name: product.name,
      cost_price: cost,
      selling_price: selling,
      profit_per_unit: profitPerUnit,
      profit_margin_percent: profitMargin,
      current_stock: stock,
      potential_profit: potentialProfit
    });
  }

  return results.sort((a, b) => b.potential_profit - a.potential_profit);
}

export async function getCategoryAnalysis() {
  const client = getSupabaseClient();

  // Get category data with product counts and values
  const { data: categories, error: categoryError } = await client
    .from("categories")
    .select("id, name");

  if (categoryError) throw new Error("Failed to fetch categories: " + categoryError.message);

  const results: Array<{
    category_id: string;
    category_name: any;
    product_count: number;
    total_stock_units: number;
    total_stock_value: number;
    average_price: number;
  }> = [];
  for (const category of categories ?? []) {
    const categoryId = category.id as string;

    // Get products in this category
    const { data: products } = await client
      .from("products")
      .select("current_stock, selling_price, cost_price")
      .eq("category_id", categoryId);

    const productCount = products?.length || 0;
    const totalStock = products?.reduce((sum, p) => sum + (p.current_stock as number), 0) || 0;
    const totalValue = products?.reduce((sum, p) => sum + ((p.current_stock as number) * (p.selling_price as number)), 0) || 0;
    const avgPrice = productCount > 0 ? products!.reduce((sum, p) => sum + (p.selling_price as number), 0) / productCount : 0;

    results.push({
      category_id: categoryId,
      category_name: category.name,
      product_count: productCount,
      total_stock_units: totalStock,
      total_stock_value: totalValue,
      average_price: avgPrice
    });
  }

  return results.sort((a, b) => b.total_stock_value - a.total_stock_value);
}

export async function getCompanyAnalysis() {
  const client = getSupabaseClient();

  const { data: companies, error: companyError } = await client
    .from("companies")
    .select("id, name");

  if (companyError) throw new Error("Failed to fetch companies: " + companyError.message);

  const results: Array<{
    company_id: string;
    company_name: any;
    product_count: number;
    total_stock_units: number;
    total_stock_value: number;
  }> = [];
  for (const company of companies ?? []) {
    const companyId = company.id as string;

    const { data: products } = await client
      .from("products")
      .select("current_stock, selling_price")
      .eq("company_id", companyId);

    const productCount = products?.length || 0;
    const totalStock = products?.reduce((sum, p) => sum + (p.current_stock as number), 0) || 0;
    const totalValue = products?.reduce((sum, p) => sum + ((p.current_stock as number) * (p.selling_price as number)), 0) || 0;

    results.push({
      company_id: companyId,
      company_name: company.name,
      product_count: productCount,
      total_stock_units: totalStock,
      total_stock_value: totalValue
    });
  }

  return results.sort((a, b) => b.total_stock_value - a.total_stock_value);
}

// ===== SEARCH AND FILTER FUNCTIONS =====

export async function advancedProductSearch(filters: {
  name?: string;
  sku?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  categoryId?: string;
  companyId?: string;
  isActive?: boolean;
}) {
  const client = getSupabaseClient();

  let query = client.from("products").select("*");

  if (filters.name) {
    query = query.ilike("name", `%${filters.name}%`);
  }
  if (filters.sku) {
    query = query.ilike("sku", `%${filters.sku}%`);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte("selling_price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("selling_price", filters.maxPrice);
  }
  if (filters.minStock !== undefined) {
    query = query.gte("current_stock", filters.minStock);
  }
  if (filters.maxStock !== undefined) {
    query = query.lte("current_stock", filters.maxStock);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.companyId) {
    query = query.eq("company_id", filters.companyId);
  }
  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const { data, error } = await query;

  if (error) throw new Error("Failed to search products: " + error.message);
  return data ?? [];
}

export async function getRecommendedReorderQuantity(productId: string, days: number = 30) {
  const client = getSupabaseClient();

  // Get sales velocity for the product
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);

  const { data: transactions, error } = await client
    .from("transactions")
    .select("quantity")
    .eq("product_id", productId)
    .gte("transaction_time", pastDate.toISOString());

  if (error) throw new Error("Failed to fetch sales data: " + error.message);

  const totalSold = transactions?.reduce((sum, t) => sum + (t.quantity as number), 0) || 0;
  const dailyVelocity = totalSold / days;
  const recommendedReorder = Math.ceil(dailyVelocity * days * 1.2); // 20% buffer

  const { data: product } = await client
    .from("products")
    .select("name, current_stock")
    .eq("id", productId)
    .single();

  return {
    product_id: productId,
    product_name: product?.name,
    current_stock: product?.current_stock,
    daily_velocity: dailyVelocity,
    total_sold_period: totalSold,
    recommended_reorder: recommendedReorder,
    analysis_period_days: days
  };
}

// ===== BULK OPERATIONS =====

export async function bulkUpdatePrices(updates: { productId: string; newPrice: number }[]) {
  const client = getSupabaseClient();

  const results: Array<{
    productId: string;
    success: boolean;
    data?: any;
    error?: string;
  }> = [];
  for (const update of updates) {
    try {
      const result = await updateProductPrice(update.productId, update.newPrice);
      results.push({ productId: update.productId, success: true, data: result });
    } catch (error) {
      results.push({ 
        productId: update.productId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return results;
}

export async function bulkUpdateStock(updates: { productId: string; newStock: number }[]) {
  const client = getSupabaseClient();

  const results: Array<{
    productId: string;
    success: boolean;
    data?: any;
    error?: string;
  }> = [];
  for (const update of updates) {
    try {
      const result = await updateProductStock(update.productId, update.newStock);
      results.push({ productId: update.productId, success: true, data: result });
    } catch (error) {
      results.push({ 
        productId: update.productId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return results;
}

// ===== CALCULATIVE FUNCTIONS FOR CHAT PROMPTS =====

// Calculate total potential revenue if all stock is sold
export async function calculateTotalPotentialRevenue() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("current_stock, selling_price, name");

  if (error) throw new Error("Failed to fetch products: " + error.message);

  let totalRevenue = 0;
  const breakdown: Array<{
    product_name: any;
    stock: number;
    price: number;
    potential_revenue: number;
  }> = [];

  for (const product of data ?? []) {
    const stock = product.current_stock as number;
    const price = product.selling_price as number;
    const revenue = stock * price;
    totalRevenue += revenue;

    breakdown.push({
      product_name: product.name,
      stock,
      price,
      potential_revenue: revenue
    });
  }

  return {
    total_potential_revenue: totalRevenue,
    breakdown: breakdown.sort((a, b) => b.potential_revenue - a.potential_revenue)
  };
}

// Calculate total cost vs selling price difference (markup)
export async function calculateTotalMarkup() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("products")
    .select("cost_price, selling_price, current_stock, name");

  if (error) throw new Error("Failed to fetch products: " + error.message);

  let totalCostValue = 0;
  let totalSellingValue = 0;
  const breakdown: Array<{
    product_name: any;
    cost_per_unit: number;
    selling_per_unit: number;
    markup_per_unit: number;
    markup_percentage: number;
    stock: number;
    total_markup_value: number;
  }> = [];

  for (const product of data ?? []) {
    const cost = product.cost_price as number;
    const selling = product.selling_price as number;
    const stock = product.current_stock as number;
    
    const markupPerUnit = selling - cost;
    const markupPercentage = cost > 0 ? ((selling - cost) / cost) * 100 : 0;
    const totalCost = cost * stock;
    const totalSelling = selling * stock;
    const totalMarkupValue = markupPerUnit * stock;

    totalCostValue += totalCost;
    totalSellingValue += totalSelling;

    breakdown.push({
      product_name: product.name,
      cost_per_unit: cost,
      selling_per_unit: selling,
      markup_per_unit: markupPerUnit,
      markup_percentage: markupPercentage,
      stock,
      total_markup_value: totalMarkupValue
    });
  }

  const overallMarkup = totalSellingValue - totalCostValue;
  const overallMarkupPercentage = totalCostValue > 0 ? (overallMarkup / totalCostValue) * 100 : 0;

  return {
    total_cost_value: totalCostValue,
    total_selling_value: totalSellingValue,
    total_markup: overallMarkup,
    overall_markup_percentage: overallMarkupPercentage,
    breakdown: breakdown.sort((a, b) => b.total_markup_value - a.total_markup_value)
  };
}

// Calculate inventory turnover in monetary terms
export async function calculateInventoryTurnoverValue() {
  const client = getSupabaseClient();

  // Get sales data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount")
    .gte("transaction_time", thirtyDaysAgo.toISOString());

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, current_stock, selling_price");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Calculate sales value by product
  const salesByProduct = new Map<string, { quantity: number; value: number }>();
  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const value = txn.total_amount as number;

    if (!salesByProduct.has(productId)) {
      salesByProduct.set(productId, { quantity, value });
    } else {
      const existing = salesByProduct.get(productId)!;
      existing.quantity += quantity;
      existing.value += value;
    }
  }

  const results: Array<{
    product_id: string;
    product_name: any;
    current_stock_value: number;
    sales_value_30_days: number;
    turnover_rate_value: number;
    turnover_rate_units: number;
  }> = [];

  let totalStockValue = 0;
  let totalSalesValue = 0;

  for (const product of products ?? []) {
    const productId = product.id as string;
    const stock = product.current_stock as number;
    const price = product.selling_price as number;
    const stockValue = stock * price;

    const sales = salesByProduct.get(productId) || { quantity: 0, value: 0 };
    const turnoverRateValue = stockValue > 0 ? sales.value / stockValue : 0;
    const turnoverRateUnits = stock > 0 ? sales.quantity / stock : 0;

    totalStockValue += stockValue;
    totalSalesValue += sales.value;

    results.push({
      product_id: productId,
      product_name: product.name,
      current_stock_value: stockValue,
      sales_value_30_days: sales.value,
      turnover_rate_value: turnoverRateValue,
      turnover_rate_units: turnoverRateUnits
    });
  }

  const overallTurnoverRate = totalStockValue > 0 ? totalSalesValue / totalStockValue : 0;

  return {
    total_inventory_value: totalStockValue,
    total_sales_value_30_days: totalSalesValue,
    overall_turnover_rate: overallTurnoverRate,
    products: results.sort((a, b) => b.turnover_rate_value - a.turnover_rate_value)
  };
}

// Calculate ROI (Return on Investment) for inventory
export async function calculateInventoryROI() {
  const client = getSupabaseClient();

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get sales data for ROI calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount")
    .gte("transaction_time", thirtyDaysAgo.toISOString());

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  const salesByProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;

    if (!salesByProduct.has(productId)) {
      salesByProduct.set(productId, { quantity, revenue });
    } else {
      const existing = salesByProduct.get(productId)!;
      existing.quantity += quantity;
      existing.revenue += revenue;
    }
  }

  const results: Array<{
    product_id: string;
    product_name: any;
    investment_cost: number;
    revenue_30_days: number;
    profit_30_days: number;
    roi_percentage: number;
    annualized_roi: number;
  }> = [];

  let totalInvestment = 0;
  let totalRevenue = 0;
  let totalProfit = 0;

  for (const product of products ?? []) {
    const productId = product.id as string;
    const costPrice = product.cost_price as number;
    const stock = product.current_stock as number;
    const investmentCost = costPrice * stock;

    const sales = salesByProduct.get(productId) || { quantity: 0, revenue: 0 };
    const costOfSales = costPrice * sales.quantity;
    const profit = sales.revenue - costOfSales;
    const roi = investmentCost > 0 ? (profit / investmentCost) * 100 : 0;
    const annualizedROI = roi * 12; // Extrapolate 30 days to 12 months

    totalInvestment += investmentCost;
    totalRevenue += sales.revenue;
    totalProfit += profit;

    results.push({
      product_id: productId,
      product_name: product.name,
      investment_cost: investmentCost,
      revenue_30_days: sales.revenue,
      profit_30_days: profit,
      roi_percentage: roi,
      annualized_roi: annualizedROI
    });
  }

  const overallROI = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
  const annualizedOverallROI = overallROI * 12;

  return {
    total_investment: totalInvestment,
    total_revenue_30_days: totalRevenue,
    total_profit_30_days: totalProfit,
    overall_roi_percentage: overallROI,
    annualized_overall_roi: annualizedOverallROI,
    products: results.sort((a, b) => b.roi_percentage - a.roi_percentage)
  };
}

// Calculate break-even analysis
export async function calculateBreakEvenAnalysis() {
  const client = getSupabaseClient();

  const { data: products, error } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock");

  if (error) throw new Error("Failed to fetch products: " + error.message);

  const results: Array<{
    product_id: string;
    product_name: any;
    cost_price: number;
    selling_price: number;
    profit_per_unit: number;
    current_stock: number;
    break_even_units: number;
    break_even_revenue: number;
    current_profit_potential: number;
    break_even_status: string;
  }> = [];

  for (const product of products ?? []) {
    const costPrice = product.cost_price as number;
    const sellingPrice = product.selling_price as number;
    const stock = product.current_stock as number;
    const profitPerUnit = sellingPrice - costPrice;

    // For break-even, we assume fixed costs are covered by the margin
    // This is a simplified break-even (units needed to recover investment)
    const totalInvestment = costPrice * stock;
    const breakEvenUnits = profitPerUnit > 0 ? Math.ceil(totalInvestment / profitPerUnit) : 0;
    const breakEvenRevenue = breakEvenUnits * sellingPrice;
    const currentProfitPotential = profitPerUnit * stock;

    let status = "Profitable";
    if (profitPerUnit <= 0) status = "Loss Making";
    else if (breakEvenUnits > stock) status = "Need More Sales";
    else status = "Break-Even Achievable";

    results.push({
      product_id: product.id as string,
      product_name: product.name,
      cost_price: costPrice,
      selling_price: sellingPrice,
      profit_per_unit: profitPerUnit,
      current_stock: stock,
      break_even_units: breakEvenUnits,
      break_even_revenue: breakEvenRevenue,
      current_profit_potential: currentProfitPotential,
      break_even_status: status
    });
  }

  return results.sort((a, b) => b.current_profit_potential - a.current_profit_potential);
}

// Calculate price optimization suggestions
export async function calculatePriceOptimization() {
  const client = getSupabaseClient();

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get sales velocity data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity")
    .gte("transaction_time", thirtyDaysAgo.toISOString());

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  const salesByProduct = new Map<string, number>();
  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    salesByProduct.set(productId, (salesByProduct.get(productId) || 0) + quantity);
  }

  const results: Array<{
    product_id: string;
    product_name: any;
    current_price: number;
    cost_price: number;
    current_margin: number;
    sales_velocity: number;
    suggested_price_low: number;
    suggested_price_optimal: number;
    suggested_price_premium: number;
    optimization_strategy: string;
    potential_revenue_increase: number;
  }> = [];

  for (const product of products ?? []) {
    const productId = product.id as string;
    const costPrice = product.cost_price as number;
    const currentPrice = product.selling_price as number;
    const currentMargin = costPrice > 0 ? ((currentPrice - costPrice) / costPrice) * 100 : 0;
    const salesVelocity = salesByProduct.get(productId) || 0;

    // Price optimization logic
    let strategy = "";
    let suggestedLow = currentPrice;
    let suggestedOptimal = currentPrice;
    let suggestedPremium = currentPrice;

    if (salesVelocity === 0) {
      // No sales - suggest price reduction
      strategy = "Reduce price to stimulate demand";
      suggestedLow = costPrice * 1.1; // 10% margin
      suggestedOptimal = costPrice * 1.25; // 25% margin
      suggestedPremium = costPrice * 1.4; // 40% margin
    } else if (salesVelocity > 50) {
      // High sales - can increase price
      strategy = "Increase price - high demand product";
      suggestedLow = currentPrice * 1.05; // 5% increase
      suggestedOptimal = currentPrice * 1.15; // 15% increase
      suggestedPremium = currentPrice * 1.25; // 25% increase
    } else if (salesVelocity > 20) {
      // Moderate sales - slight optimization
      strategy = "Optimize price for better margin";
      suggestedLow = currentPrice * 1.02; // 2% increase
      suggestedOptimal = currentPrice * 1.08; // 8% increase
      suggestedPremium = currentPrice * 1.15; // 15% increase
    } else {
      // Low sales - consider price reduction
      strategy = "Consider price reduction or promotion";
      suggestedLow = currentPrice * 0.9; // 10% reduction
      suggestedOptimal = currentPrice * 0.95; // 5% reduction
      suggestedPremium = currentPrice; // Keep current
    }

    const potentialRevenueIncrease = (suggestedOptimal - currentPrice) * (product.current_stock as number);

    results.push({
      product_id: productId,
      product_name: product.name,
      current_price: currentPrice,
      cost_price: costPrice,
      current_margin: currentMargin,
      sales_velocity: salesVelocity,
      suggested_price_low: Math.max(suggestedLow, costPrice * 1.05), // Ensure minimum 5% margin
      suggested_price_optimal: Math.max(suggestedOptimal, costPrice * 1.1), // Ensure minimum 10% margin
      suggested_price_premium: Math.max(suggestedPremium, costPrice * 1.15), // Ensure minimum 15% margin
      optimization_strategy: strategy,
      potential_revenue_increase: potentialRevenueIncrease
    });
  }

  return results.sort((a, b) => b.potential_revenue_increase - a.potential_revenue_increase);
}

// Calculate ABC analysis (inventory classification)
export async function calculateABCAnalysis() {
  const client = getSupabaseClient();

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, current_stock, selling_price, cost_price");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get sales data for ABC classification
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount")
    .gte("transaction_time", ninetyDaysAgo.toISOString());

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  const salesByProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;

    if (!salesByProduct.has(productId)) {
      salesByProduct.set(productId, { quantity, revenue });
    } else {
      const existing = salesByProduct.get(productId)!;
      existing.quantity += quantity;
      existing.revenue += revenue;
    }
  }

  const productAnalysis: Array<{
    product_id: string;
    product_name: any;
    stock_value: number;
    sales_revenue_90_days: number;
    sales_quantity_90_days: number;
    revenue_percentage: number;
    classification: string;
  }> = [];

  let totalRevenue = 0;

  for (const product of products ?? []) {
    const productId = product.id as string;
    const stock = product.current_stock as number;
    const price = product.selling_price as number;
    const stockValue = stock * price;

    const sales = salesByProduct.get(productId) || { quantity: 0, revenue: 0 };
    const revenue = sales.revenue;
    totalRevenue += revenue;

    productAnalysis.push({
      product_id: productId,
      product_name: product.name,
      stock_value: stockValue,
      sales_revenue_90_days: revenue,
      sales_quantity_90_days: sales.quantity,
      revenue_percentage: 0, // Will calculate after getting total
      classification: ""
    });
  }

  // Calculate revenue percentages and sort
  for (const item of productAnalysis) {
    item.revenue_percentage = totalRevenue > 0 ? (item.sales_revenue_90_days / totalRevenue) * 100 : 0;
  }

  productAnalysis.sort((a, b) => b.revenue_percentage - a.revenue_percentage);

  // Apply ABC classification
  let cumulativePercentage = 0;
  for (const item of productAnalysis) {
    cumulativePercentage += item.revenue_percentage;
    
    if (cumulativePercentage <= 80) {
      item.classification = "A - High Value";
    } else if (cumulativePercentage <= 95) {
      item.classification = "B - Medium Value";
    } else {
      item.classification = "C - Low Value";
    }
  }

  const summary = {
    A_class: productAnalysis.filter(p => p.classification.startsWith("A")).length,
    B_class: productAnalysis.filter(p => p.classification.startsWith("B")).length,
    C_class: productAnalysis.filter(p => p.classification.startsWith("C")).length,
    total_products: productAnalysis.length,
    total_revenue_90_days: totalRevenue
  };

  return {
    summary,
    products: productAnalysis
  };
}

// ===== ADVANCED FINANCIAL & FORECASTING FUNCTIONS =====

// Calculate comprehensive financial dashboard metrics
export async function calculateComprehensiveFinancialMetrics() {
  const client = getSupabaseClient();

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get transaction data for the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount, transaction_time")
    .gte("transaction_time", ninetyDaysAgo.toISOString());

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  // Calculate key financial metrics
  let totalInventoryValue = 0;
  let totalInventoryCost = 0;
  let totalSalesRevenue = 0;
  let totalCostOfGoodsSold = 0;
  let totalPotentialRevenue = 0;

  const productMap = new Map(products?.map(p => [p.id as string, p]) ?? []);
  const salesMap = new Map<string, { quantity: number; revenue: number }>();

  // Process transactions
  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;

    if (!salesMap.has(productId)) {
      salesMap.set(productId, { quantity, revenue });
    } else {
      const existing = salesMap.get(productId)!;
      existing.quantity += quantity;
      existing.revenue += revenue;
    }

    totalSalesRevenue += revenue;
  }

  // Calculate product-level metrics
  for (const product of products ?? []) {
    const costPrice = product.cost_price as number;
    const sellingPrice = product.selling_price as number;
    const stock = product.current_stock as number;

    const inventoryValue = stock * sellingPrice;
    const inventoryCost = stock * costPrice;

    totalInventoryValue += inventoryValue;
    totalInventoryCost += inventoryCost;
    totalPotentialRevenue += inventoryValue;

    // Calculate COGS for sold items
    const sales = salesMap.get(product.id as string);
    if (sales) {
      totalCostOfGoodsSold += sales.quantity * costPrice;
    }
  }

  const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;
  const grossMargin = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;
  const inventoryTurnover = totalInventoryCost > 0 ? totalCostOfGoodsSold / totalInventoryCost : 0;
  const averageInventoryDays = inventoryTurnover > 0 ? 365 / inventoryTurnover : 0;

  return {
    financial_summary: {
      total_inventory_value: totalInventoryValue,
      total_inventory_cost: totalInventoryCost,
      total_sales_revenue_90_days: totalSalesRevenue,
      cost_of_goods_sold_90_days: totalCostOfGoodsSold,
      gross_profit_90_days: grossProfit,
      gross_margin_percentage: grossMargin,
      inventory_turnover_ratio: inventoryTurnover,
      average_inventory_days: averageInventoryDays,
      potential_revenue_remaining: totalPotentialRevenue - totalSalesRevenue
    },
    key_insights: [
      `Current inventory is worth $${totalInventoryValue.toFixed(2)}`,
      `Gross profit margin is ${grossMargin.toFixed(1)}%`,
      `Inventory turns over every ${averageInventoryDays.toFixed(0)} days`,
      `$${(totalPotentialRevenue - totalSalesRevenue).toFixed(2)} in unsold inventory potential`
    ]
  };
}

// Calculate sales trend analysis and forecasting
export async function calculateSalesTrendAnalysis() {
  const client = getSupabaseClient();

  // Get daily sales data for the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: transactions, error } = await client
    .from("transactions")
    .select("total_amount, quantity, transaction_time")
    .gte("transaction_time", ninetyDaysAgo.toISOString())
    .order("transaction_time", { ascending: true });

  if (error) throw new Error("Failed to fetch transactions: " + error.message);

  // Group by day
  const dailySales = new Map<string, { revenue: number; quantity: number; transactions: number }>();
  
  for (const txn of transactions ?? []) {
    const date = new Date(txn.transaction_time as string).toISOString().split('T')[0];
    const revenue = txn.total_amount as number;
    const quantity = txn.quantity as number;

    if (!dailySales.has(date)) {
      dailySales.set(date, { revenue, quantity, transactions: 1 });
    } else {
      const existing = dailySales.get(date)!;
      existing.revenue += revenue;
      existing.quantity += quantity;
      existing.transactions += 1;
    }
  }

  const sortedDays = Array.from(dailySales.entries()).sort(([a], [b]) => a.localeCompare(b));
  
  // Calculate trends (simple linear regression)
  const n = sortedDays.length;
  if (n < 7) {
    return {
      trend_analysis: "Insufficient data for trend analysis (need at least 7 days)",
      daily_averages: {
        revenue: 0,
        quantity: 0,
        transactions: 0
      }
    };
  }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  sortedDays.forEach(([date, data], index) => {
    const x = index;
    const y = data.revenue;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate averages and projections
  const totalRevenue = sortedDays.reduce((sum, [, data]) => sum + data.revenue, 0);
  const totalQuantity = sortedDays.reduce((sum, [, data]) => sum + data.quantity, 0);
  const totalTransactions = sortedDays.reduce((sum, [, data]) => sum + data.transactions, 0);

  const avgDailyRevenue = totalRevenue / n;
  const avgDailyQuantity = totalQuantity / n;
  const avgDailyTransactions = totalTransactions / n;

  // Forecast next 30 days
  const forecastDays = 30;
  const projectedRevenue = Array.from({ length: forecastDays }, (_, i) => {
    const dayIndex = n + i;
    return slope * dayIndex + intercept;
  });

  const projectedMonthlyRevenue = projectedRevenue.reduce((sum, daily) => sum + daily, 0);

  let trendDirection = "stable";
  if (slope > avgDailyRevenue * 0.01) trendDirection = "growing";
  else if (slope < -avgDailyRevenue * 0.01) trendDirection = "declining";

  return {
    trend_analysis: {
      direction: trendDirection,
      daily_growth_rate: slope,
      growth_percentage: avgDailyRevenue > 0 ? (slope / avgDailyRevenue) * 100 : 0,
      correlation_strength: n > 1 ? Math.abs(slope) / (avgDailyRevenue || 1) : 0
    },
    current_period_stats: {
      days_analyzed: n,
      total_revenue: totalRevenue,
      total_quantity: totalQuantity,
      total_transactions: totalTransactions
    },
    daily_averages: {
      revenue: avgDailyRevenue,
      quantity: avgDailyQuantity,
      transactions: avgDailyTransactions
    },
    forecasting: {
      projected_30_day_revenue: projectedMonthlyRevenue,
      projected_daily_average: projectedMonthlyRevenue / 30,
      confidence_level: n >= 30 ? "High" : n >= 14 ? "Medium" : "Low"
    },
    recommendations: [
      trendDirection === "growing" ? "Capitalize on growth trend with inventory expansion" :
      trendDirection === "declining" ? "Investigate declining sales and consider promotions" :
      "Maintain current strategy - sales are stable",
      
      avgDailyRevenue < 100 ? "Focus on increasing average transaction value" :
      avgDailyRevenue > 1000 ? "Excellent performance - consider scaling operations" :
      "Good performance - monitor for optimization opportunities"
    ]
  };
}

// Calculate advanced profitability analysis by multiple dimensions
export async function calculateAdvancedProfitabilityAnalysis() {
  const client = getSupabaseClient();

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock, category_id, company_id");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get categories and companies for grouping
  const { data: categories } = await client.from("categories").select("id, name");
  const { data: companies } = await client.from("companies").select("id, name");

  const categoryMap = new Map(categories?.map(c => [c.id as string, c.name]) ?? []);
  const companyMap = new Map(companies?.map(c => [c.id as string, c.name]) ?? []);

  // Get sales data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount")
    .gte("transaction_time", thirtyDaysAgo.toISOString());

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  const salesByProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;

    if (!salesByProduct.has(productId)) {
      salesByProduct.set(productId, { quantity, revenue });
    } else {
      const existing = salesByProduct.get(productId)!;
      existing.quantity += quantity;
      existing.revenue += revenue;
    }
  }

  // Analyze by product
  const productAnalysis: Array<{
    product_id: string;
    product_name: any;
    category_name: string;
    company_name: string;
    cost_price: number;
    selling_price: number;
    current_stock: number;
    units_sold: number;
    revenue_generated: number;
    cost_of_sales: number;
    gross_profit: number;
    profit_margin: number;
    inventory_value: number;
    roi: number;
    contribution_margin: number;
  }> = [];

  for (const product of products ?? []) {
    const productId = product.id as string;
    const costPrice = product.cost_price as number;
    const sellingPrice = product.selling_price as number;
    const stock = product.current_stock as number;
    
    const sales = salesByProduct.get(productId) || { quantity: 0, revenue: 0 };
    const costOfSales = costPrice * sales.quantity;
    const grossProfit = sales.revenue - costOfSales;
    const profitMargin = sales.revenue > 0 ? (grossProfit / sales.revenue) * 100 : 0;
    const inventoryValue = stock * sellingPrice;
    const roi = inventoryValue > 0 ? (grossProfit / inventoryValue) * 100 : 0;
    const contributionMargin = sellingPrice - costPrice;

    productAnalysis.push({
      product_id: productId,
      product_name: product.name,
      category_name: (categoryMap.get(product.category_id as string) as string) || "Unknown",
      company_name: (companyMap.get(product.company_id as string) as string) || "Unknown",
      cost_price: costPrice,
      selling_price: sellingPrice,
      current_stock: stock,
      units_sold: sales.quantity,
      revenue_generated: sales.revenue,
      cost_of_sales: costOfSales,
      gross_profit: grossProfit,
      profit_margin: profitMargin,
      inventory_value: inventoryValue,
      roi: roi,
      contribution_margin: contributionMargin
    });
  }

  // Aggregate by category
  const categoryAnalysis = new Map<string, {
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    total_inventory_value: number;
    product_count: number;
  }>();

  for (const item of productAnalysis) {
    const category = item.category_name;
    if (!categoryAnalysis.has(category)) {
      categoryAnalysis.set(category, {
        total_revenue: 0,
        total_cost: 0,
        total_profit: 0,
        total_inventory_value: 0,
        product_count: 0
      });
    }
    const catData = categoryAnalysis.get(category)!;
    catData.total_revenue += item.revenue_generated;
    catData.total_cost += item.cost_of_sales;
    catData.total_profit += item.gross_profit;
    catData.total_inventory_value += item.inventory_value;
    catData.product_count += 1;
  }

  // Calculate totals
  const totals = productAnalysis.reduce((acc, item) => ({
    revenue: acc.revenue + item.revenue_generated,
    cost: acc.cost + item.cost_of_sales,
    profit: acc.profit + item.gross_profit,
    inventory_value: acc.inventory_value + item.inventory_value
  }), { revenue: 0, cost: 0, profit: 0, inventory_value: 0 });

  return {
    overall_metrics: {
      total_revenue: totals.revenue,
      total_cost: totals.cost,
      total_profit: totals.profit,
      overall_margin: totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0,
      total_inventory_value: totals.inventory_value,
      average_roi: totals.inventory_value > 0 ? (totals.profit / totals.inventory_value) * 100 : 0
    },
    top_performers: {
      by_revenue: productAnalysis.sort((a, b) => b.revenue_generated - a.revenue_generated).slice(0, 5),
      by_profit: productAnalysis.sort((a, b) => b.gross_profit - a.gross_profit).slice(0, 5),
      by_margin: productAnalysis.sort((a, b) => b.profit_margin - a.profit_margin).slice(0, 5),
      by_roi: productAnalysis.sort((a, b) => b.roi - a.roi).slice(0, 5)
    },
    category_analysis: Array.from(categoryAnalysis.entries()).map(([name, data]) => ({
      category_name: name,
      total_revenue: data.total_revenue,
      total_profit: data.total_profit,
      profit_margin: data.total_revenue > 0 ? (data.total_profit / data.total_revenue) * 100 : 0,
      inventory_value: data.total_inventory_value,
      product_count: data.product_count
    })).sort((a, b) => b.total_profit - a.total_profit)
  };
}

// Calculate customer lifetime value estimates based on product sales patterns
export async function calculateCustomerValueMetrics() {
  const client = getSupabaseClient();

  // Get transaction data for CLV estimation
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: transactions, error } = await client
    .from("transactions")
    .select("total_amount, quantity, transaction_time")
    .gte("transaction_time", ninetyDaysAgo.toISOString());

  if (error) throw new Error("Failed to fetch transactions: " + error.message);

  if (!transactions || transactions.length === 0) {
    return {
      customer_metrics: {
        estimated_customer_lifetime_value: 0,
        average_order_value: 0,
        average_units_per_transaction: 0,
        purchase_frequency: 0
      },
      insights: ["No transaction data available for customer value analysis"]
    };
  }

  // Calculate key customer metrics
  const totalRevenue = transactions.reduce((sum, txn) => sum + (txn.total_amount as number), 0);
  const totalQuantity = transactions.reduce((sum, txn) => sum + (txn.quantity as number), 0);
  const transactionCount = transactions.length;

  const averageOrderValue = totalRevenue / transactionCount;
  const averageUnitsPerTransaction = totalQuantity / transactionCount;
  
  // Group transactions by day to calculate frequency
  const transactionsByDay = new Map<string, number>();
  for (const txn of transactions) {
    const date = new Date(txn.transaction_time as string).toISOString().split('T')[0];
    transactionsByDay.set(date, (transactionsByDay.get(date) || 0) + 1);
  }

  const activeDays = transactionsByDay.size;
  const averageTransactionsPerDay = transactionCount / activeDays;
  
  // Estimate monthly transaction frequency (assuming 30 days)
  const monthlyTransactionFrequency = averageTransactionsPerDay * 30;
  
  // Simple CLV calculation (AOV × Monthly Frequency × 12 months)
  const estimatedCLV = averageOrderValue * monthlyTransactionFrequency * 12;

  // Calculate seasonal patterns (by day of week)
  const dayOfWeekPattern = new Map<number, { transactions: number; revenue: number }>();
  for (const txn of transactions) {
    const dayOfWeek = new Date(txn.transaction_time as string).getDay(); // 0 = Sunday
    if (!dayOfWeekPattern.has(dayOfWeek)) {
      dayOfWeekPattern.set(dayOfWeek, { transactions: 0, revenue: 0 });
    }
    const day = dayOfWeekPattern.get(dayOfWeek)!;
    day.transactions += 1;
    day.revenue += txn.total_amount as number;
  }

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyPattern = Array.from(dayOfWeekPattern.entries()).map(([day, data]) => ({
    day_of_week: weekdayNames[day],
    transaction_count: data.transactions,
    total_revenue: data.revenue,
    average_revenue_per_day: data.revenue / data.transactions
  })).sort((a, b) => b.total_revenue - a.total_revenue);

  return {
    customer_metrics: {
      estimated_customer_lifetime_value: estimatedCLV,
      average_order_value: averageOrderValue,
      average_units_per_transaction: averageUnitsPerTransaction,
      monthly_transaction_frequency: monthlyTransactionFrequency,
      active_days_in_period: activeDays,
      total_transactions_analyzed: transactionCount
    },
    weekly_patterns: weeklyPattern,
    insights: [
      `Estimated Customer Lifetime Value: $${estimatedCLV.toFixed(2)}`,
      `Average Order Value: $${averageOrderValue.toFixed(2)}`,
      `Best performing day: ${weeklyPattern[0]?.day_of_week || 'N/A'}`,
      activeDays < 30 ? "Limited activity - consider customer acquisition strategies" :
      averageOrderValue > 100 ? "High-value customers - focus on retention" :
      "Optimize for increased transaction frequency and order value"
    ]
  };
}

// Calculate product performance scoring with weighted metrics
export async function calculateProductPerformanceScore() {
  const client = getSupabaseClient();

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get sales data for scoring
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: transactions, error: transactionError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount")
    .gte("transaction_time", thirtyDaysAgo.toISOString());

  if (transactionError) throw new Error("Failed to fetch transactions: " + transactionError.message);

  const salesByProduct = new Map<string, { quantity: number; revenue: number }>();
  for (const txn of transactions ?? []) {
    const productId = txn.product_id as string;
    const quantity = txn.quantity as number;
    const revenue = txn.total_amount as number;

    if (!salesByProduct.has(productId)) {
      salesByProduct.set(productId, { quantity, revenue });
    } else {
      const existing = salesByProduct.get(productId)!;
      existing.quantity += quantity;
      existing.revenue += revenue;
    }
  }

  // Calculate max values for normalization
  const maxRevenue = Math.max(...Array.from(salesByProduct.values()).map(s => s.revenue), 1);
  const maxQuantity = Math.max(...Array.from(salesByProduct.values()).map(s => s.quantity), 1);
  const maxMargin = Math.max(...(products ?? []).map(p => {
    const cost = p.cost_price as number;
    const selling = p.selling_price as number;
    return cost > 0 ? ((selling - cost) / selling) * 100 : 0;
  }), 1);

  const productScores: Array<{
    product_id: string;
    product_name: any;
    revenue_score: number;
    quantity_score: number;
    margin_score: number;
    stock_efficiency_score: number;
    overall_score: number;
    performance_grade: string;
    recommendations: string[];
  }> = [];

  for (const product of products ?? []) {
    const productId = product.id as string;
    const costPrice = product.cost_price as number;
    const sellingPrice = product.selling_price as number;
    const stock = product.current_stock as number;

    const sales = salesByProduct.get(productId) || { quantity: 0, revenue: 0 };
    
    // Calculate individual scores (0-100)
    const revenueScore = (sales.revenue / maxRevenue) * 100;
    const quantityScore = (sales.quantity / maxQuantity) * 100;
    
    const marginPercent = costPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
    const marginScore = (marginPercent / maxMargin) * 100;
    
    // Stock efficiency: higher turnover = better score
    const turnoverRate = stock > 0 ? sales.quantity / stock : 0;
    const stockEfficiencyScore = Math.min(turnoverRate * 100, 100); // Cap at 100
    
    // Weighted overall score
    const weights = {
      revenue: 0.3,
      quantity: 0.2,
      margin: 0.3,
      stockEfficiency: 0.2
    };
    
    const overallScore = (
      revenueScore * weights.revenue +
      quantityScore * weights.quantity +
      marginScore * weights.margin +
      stockEfficiencyScore * weights.stockEfficiency
    );

    // Performance grade
    let grade = "F";
    if (overallScore >= 80) grade = "A";
    else if (overallScore >= 70) grade = "B";
    else if (overallScore >= 60) grade = "C";
    else if (overallScore >= 50) grade = "D";

    // Generate recommendations
    const recommendations: string[] = [];
    if (revenueScore < 30) recommendations.push("Low revenue - consider marketing or price optimization");
    if (quantityScore < 30) recommendations.push("Low sales volume - investigate demand issues");
    if (marginScore < 50) recommendations.push("Poor margins - review pricing or cost structure");
    if (stockEfficiencyScore < 30) recommendations.push("Slow inventory turnover - consider promotions");
    if (overallScore >= 80) recommendations.push("Excellent performer - maintain current strategy");

    productScores.push({
      product_id: productId,
      product_name: product.name,
      revenue_score: revenueScore,
      quantity_score: quantityScore,
      margin_score: marginScore,
      stock_efficiency_score: stockEfficiencyScore,
      overall_score: overallScore,
      performance_grade: grade,
      recommendations
    });
  }

  return {
    performance_summary: {
      total_products_analyzed: productScores.length,
      grade_distribution: {
        A: productScores.filter(p => p.performance_grade === "A").length,
        B: productScores.filter(p => p.performance_grade === "B").length,
        C: productScores.filter(p => p.performance_grade === "C").length,
        D: productScores.filter(p => p.performance_grade === "D").length,
        F: productScores.filter(p => p.performance_grade === "F").length
      },
      average_overall_score: productScores.reduce((sum, p) => sum + p.overall_score, 0) / productScores.length
    },
    product_scores: productScores.sort((a, b) => b.overall_score - a.overall_score),
    top_performers: productScores.filter(p => p.performance_grade === "A").slice(0, 10),
    improvement_needed: productScores.filter(p => p.performance_grade === "F").slice(0, 10)
  };
}

// Calculate competitive analysis and market positioning
export async function calculateMarketPositioningAnalysis() {
  const client = getSupabaseClient();

  const { data: products, error: productError } = await client
    .from("products")
    .select("id, name, cost_price, selling_price, current_stock, category_id");

  if (productError) throw new Error("Failed to fetch products: " + productError.message);

  // Get categories for grouping
  const { data: categories } = await client.from("categories").select("id, name");
  const categoryMap = new Map(categories?.map(c => [c.id as string, c.name]) ?? []);

  // Group products by category for analysis
  const categoryGroups = new Map<string, Array<{
    id: string;
    name: any;
    cost_price: number;
    selling_price: number;
    current_stock: number;
    markup_percentage: number;
  }>>();

  for (const product of products ?? []) {
    const categoryId = product.category_id as string;
    const categoryName = (categoryMap.get(categoryId) as string) || "Unknown";
    
    const markupPercentage = (product.cost_price as number) > 0 ? 
      (((product.selling_price as number) - (product.cost_price as number)) / (product.cost_price as number)) * 100 : 0;

    if (!categoryGroups.has(categoryName)) {
      categoryGroups.set(categoryName, []);
    }

    categoryGroups.get(categoryName)!.push({
      id: product.id as string,
      name: product.name,
      cost_price: product.cost_price as number,
      selling_price: product.selling_price as number,
      current_stock: product.current_stock as number,
      markup_percentage: markupPercentage
    });
  }

  const categoryAnalysis: Array<{
    category_name: string;
    product_count: number;
    price_range: { min: number; max: number; average: number };
    markup_range: { min: number; max: number; average: number };
    market_positioning: string;
    competitive_insights: string[];
    recommended_strategies: string[];
  }> = [];

  for (const [categoryName, categoryProducts] of categoryGroups.entries()) {
    const prices = categoryProducts.map(p => p.selling_price);
    const markups = categoryProducts.map(p => p.markup_percentage);
    
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length
    };
    
    const markupRange = {
      min: Math.min(...markups),
      max: Math.max(...markups),
      average: markups.reduce((sum, markup) => sum + markup, 0) / markups.length
    };
    
    // Determine market positioning
    let positioning = "Mid-Market";
    if (markupRange.average > 50) positioning = "Premium";
    else if (markupRange.average < 20) positioning = "Budget";
    
    // Generate competitive insights
    const insights: string[] = [];
    if (markupRange.max - markupRange.min > 30) {
      insights.push("High price variation suggests diverse positioning strategies");
    }
    if (markupRange.average > 40) {
      insights.push("Above-average margins indicate strong brand value or unique positioning");
    }
    if (categoryProducts.length > 10) {
      insights.push("Large product portfolio provides competitive advantage");
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (markupRange.average < 25) {
      recommendations.push("Consider value-added services to increase margins");
    }
    if (priceRange.max / priceRange.min > 3) {
      recommendations.push("Review pricing strategy for consistency");
    }
    recommendations.push("Monitor competitor pricing for market positioning opportunities");
    
    categoryAnalysis.push({
      category_name: categoryName,
      product_count: categoryProducts.length,
      price_range: priceRange,
      markup_range: markupRange,
      market_positioning: positioning,
      competitive_insights: insights,
      recommended_strategies: recommendations
    });
  }
  
  return categoryAnalysis;
}