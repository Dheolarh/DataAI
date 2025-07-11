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

// ===== BASIC CATEGORY FUNCTIONS =====

export async function getAllCategories() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("categories")
    .select("id, name, description, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch categories: " + error.message);
  }

  return data ?? [];
}

export async function getCategoryById(categoryId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("categories")
    .select("id, name, description, created_at, updated_at")
    .eq("id", categoryId)
    .single();

  if (error) {
    throw new Error("Failed to fetch category: " + error.message);
  }

  return data;
}

export async function getCategoryByName(categoryName: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("categories")
    .select("id, name, description, created_at, updated_at")
    .ilike("name", categoryName)
    .single();

  if (error) {
    throw new Error("Failed to fetch category by name: " + error.message);
  }

  return data;
}

export async function getRecentlyAddedCategories(days: number = 30) {
  const client = getSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await client
    .from("categories")
    .select("id, name, description, created_at, updated_at")
    .gte("created_at", cutoffDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch recently added categories: " + error.message);
  }

  return data ?? [];
}

export async function getRecentlyUpdatedCategories(days: number = 7) {
  const client = getSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await client
    .from("categories")
    .select("id, name, description, created_at, updated_at")
    .gte("updated_at", cutoffDate.toISOString())
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch recently updated categories: " + error.message);
  }

  // Filter out categories where updated_at equals created_at (never been updated)
  const filteredData = (data ?? []).filter(category => {
    const createdAt = new Date(category.created_at as string);
    const updatedAt = new Date(category.updated_at as string);
    return updatedAt.getTime() !== createdAt.getTime();
  });

  return filteredData;
}

// ===== CATEGORY ANALYTICS FUNCTIONS =====

export async function getCategoryProductCount() {
  const client = getSupabaseClient();

  // Get all categories
  const { data: categories, error: categoriesError } = await client
    .from("categories")
    .select("id, name, description");

  if (categoriesError) {
    throw new Error("Failed to fetch categories: " + categoriesError.message);
  }

  // Get product counts per category
  const { data: products, error: productsError } = await client
    .from("products")
    .select("category_id");

  if (productsError) {
    throw new Error("Failed to fetch products: " + productsError.message);
  }

  // Count products by category
  const productCounts = (products ?? []).reduce((acc, product) => {
    const categoryId = product.category_id as string;
    if (!acc[categoryId]) {
      acc[categoryId] = 0;
    }
    acc[categoryId]++;
    return acc;
  }, {} as Record<string, number>);

  return (categories ?? []).map(category => ({
    id: category.id,
    name: category.name,
    description: category.description,
    product_count: productCounts[category.id as string] || 0
  })).sort((a, b) => b.product_count - a.product_count);
}

export async function getCategoriesWithProducts() {
  const client = getSupabaseClient();

  const { data: categories, error } = await client
    .from("categories")
    .select(`
      id,
      name,
      description,
      created_at,
      products!inner(id)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch categories with products: " + error.message);
  }

  // Group by category and count products
  const categoriesMap = new Map();
  
  (categories ?? []).forEach(category => {
    const categoryId = category.id as string;
    if (!categoriesMap.has(categoryId)) {
      categoriesMap.set(categoryId, {
        id: category.id,
        name: category.name,
        description: category.description,
        created_at: category.created_at,
        product_count: 0
      });
    }
    categoriesMap.get(categoryId).product_count++;
  });

  return Array.from(categoriesMap.values());
}

export async function getCategoriesWithoutProducts() {
  const client = getSupabaseClient();

  // Get all categories
  const { data: allCategories, error: allCategoriesError } = await client
    .from("categories")
    .select("id, name, description, created_at");

  if (allCategoriesError) {
    throw new Error("Failed to fetch all categories: " + allCategoriesError.message);
  }

  // Get unique category IDs that have products
  const { data: productsData, error: productsError } = await client
    .from("products")
    .select("category_id");

  if (productsError) {
    throw new Error("Failed to fetch products data: " + productsError.message);
  }

  const categoriesWithProductsIds = new Set(productsData?.map(p => p.category_id as string) || []);

  // Filter categories without products
  return (allCategories ?? []).filter(category => 
    !categoriesWithProductsIds.has(category.id as string)
  );
}

export async function getTopCategoriesByProductCount(limit: number = 10) {
  const categoriesWithCounts = await getCategoryProductCount();
  return categoriesWithCounts.slice(0, limit);
}

export async function getCategoryProductAnalysis(categoryId: string) {
  const client = getSupabaseClient();

  // Get category details
  const { data: category, error: categoryError } = await client
    .from("categories")
    .select("id, name, description, created_at")
    .eq("id", categoryId)
    .single();

  if (categoryError) {
    throw new Error("Failed to fetch category: " + categoryError.message);
  }

  // Get products for this category
  const { data: products, error: productsError } = await client
    .from("products")
    .select(`
      id,
      name,
      sku,
      selling_price,
      current_stock,
      is_active,
      companies!inner(name)
    `)
    .eq("category_id", categoryId)
    .order("name", { ascending: true });

  if (productsError) {
    throw new Error("Failed to fetch category products: " + productsError.message);
  }

  // Calculate analytics
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.is_active).length || 0;
  const inactiveProducts = totalProducts - activeProducts;
  const totalStockValue = products?.reduce((sum, p) => sum + ((p.selling_price as number) * (p.current_stock as number)), 0) || 0;
  const averagePrice = totalProducts > 0 ? (products?.reduce((sum, p) => sum + (p.selling_price as number), 0) || 0) / totalProducts : 0;
  const totalStock = products?.reduce((sum, p) => sum + (p.current_stock as number), 0) || 0;
  const outOfStockProducts = products?.filter(p => (p.current_stock as number) === 0).length || 0;

  // Company distribution
  const companyDistribution = products?.reduce((acc, product) => {
    const companyName = (product.companies as any)?.name || 'Unknown';
    if (!acc[companyName]) {
      acc[companyName] = 0;
    }
    acc[companyName]++;
    return acc;
  }, {} as Record<string, number>) || {};

  const categoryDistribution = Object.entries(companyDistribution).map(([company, count]) => ({
    company,
    product_count: count,
    percentage: totalProducts > 0 ? ((count / totalProducts) * 100).toFixed(1) : '0'
  })).sort((a, b) => b.product_count - a.product_count);

  return {
    category: {
      id: category.id,
      name: category.name,
      description: category.description,
      created_at: category.created_at
    },
    analytics: {
      total_products: totalProducts,
      active_products: activeProducts,
      inactive_products: inactiveProducts,
      total_stock_value: totalStockValue,
      average_product_price: averagePrice,
      total_stock: totalStock,
      out_of_stock_products: outOfStockProducts,
      company_distribution: categoryDistribution
    },
    products: products || []
  };
}

// ===== CATEGORY SEARCH FUNCTIONS =====

export async function searchCategories(searchTerm: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("categories")
    .select("id, name, description, created_at, updated_at")
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to search categories: " + error.message);
  }

  return data ?? [];
}

export async function advancedCategorySearch(options: {
  name?: string;
  description?: string;
  hasProducts?: boolean;
  hasDescription?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
}) {
  const client = getSupabaseClient();

  let query = client
    .from("categories")
    .select("id, name, description, created_at, updated_at");

  if (options.name) {
    query = query.ilike("name", `%${options.name}%`);
  }

  if (options.description) {
    query = query.ilike("description", `%${options.description}%`);
  }

  if (options.hasDescription) {
    query = query.not("description", "is", null);
  }

  if (options.createdAfter) {
    query = query.gte("created_at", options.createdAfter);
  }

  if (options.createdBefore) {
    query = query.lte("created_at", options.createdBefore);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  query = query.order("name", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to perform advanced category search: " + error.message);
  }

  return data ?? [];
}

// ===== CATEGORY TRENDS AND ANALYTICS =====

export async function getCategoryCreationTrends(days: number = 30) {
  const client = getSupabaseClient();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("categories")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch category creation trends: " + error.message);
  }

  // Group by date
  const dailyCreations = (data ?? []).reduce((acc, category) => {
    const date = new Date(category.created_at as string).toISOString().substring(0, 10);
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

  const trends: { date: string; categories_created: number }[] = [];
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateString = currentDate.toISOString().substring(0, 10);
    
    trends.push({
      date: dateString,
      categories_created: dailyCreations[dateString] || 0
    });
  }

  const totalCreated = Object.values(dailyCreations).reduce((sum, count) => sum + count, 0);
  const averagePerDay = totalCreated / days;

  return {
    trends,
    summary: {
      total_categories_created: totalCreated,
      average_per_day: Math.round(averagePerDay * 100) / 100,
      period_days: days
    }
  };
}

export async function getCategoryPerformanceMetrics() {
  const client = getSupabaseClient();

  // Get all categories with their product counts and stock values
  const categoriesWithCounts = await getCategoryProductCount();
  
  // Get transaction data to calculate sales performance
  const { data: transactions, error: transactionsError } = await client
    .from("transactions")
    .select("product_id, quantity, total_amount");

  if (transactionsError) {
    throw new Error("Failed to fetch transactions: " + transactionsError.message);
  }

  // Get products with category information
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id, category_id, selling_price, current_stock");

  if (productsError) {
    throw new Error("Failed to fetch products: " + productsError.message);
  }

  // Calculate sales by category
  const salesByCategory = new Map<string, { total_sales: number; total_quantity: number }>();
  
  (transactions ?? []).forEach(transaction => {
    const product = products?.find(p => p.id === transaction.product_id);
    if (product) {
      const categoryId = product.category_id as string;
      if (!salesByCategory.has(categoryId)) {
        salesByCategory.set(categoryId, { total_sales: 0, total_quantity: 0 });
      }
      const categoryData = salesByCategory.get(categoryId)!;
      categoryData.total_sales += transaction.total_amount as number;
      categoryData.total_quantity += transaction.quantity as number;
    }
  });

  // Combine category data with sales data
  const performanceMetrics = categoriesWithCounts.map(category => {
    const salesData = salesByCategory.get(category.id as string) || { total_sales: 0, total_quantity: 0 };
    const categoryProducts = products?.filter(p => p.category_id === category.id) || [];
    const totalStockValue = categoryProducts.reduce((sum, p) => sum + ((p.selling_price as number) * (p.current_stock as number)), 0);
    
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      product_count: category.product_count,
      total_sales: salesData.total_sales,
      total_quantity_sold: salesData.total_quantity,
      total_stock_value: totalStockValue,
      average_sale_per_product: category.product_count > 0 ? salesData.total_sales / category.product_count : 0,
      performance_score: (salesData.total_sales * 0.6) + (category.product_count * 0.4)
    };
  }).sort((a, b) => b.performance_score - a.performance_score);

  return performanceMetrics;
}

// ===== CATEGORY MANAGEMENT FUNCTIONS =====

export async function createCategory(categoryData: {
  name: string;
  description?: string;
}) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("categories")
    .insert([categoryData])
    .select("id, name, description, created_at")
    .single();

  if (error) {
    throw new Error("Failed to create category: " + error.message);
  }

  return data;
}

export async function updateCategory(categoryId: string, updates: {
  name?: string;
  description?: string;
}) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("categories")
    .update(updates)
    .eq("id", categoryId)
    .select("id, name, description, updated_at")
    .single();

  if (error) {
    throw new Error("Failed to update category: " + error.message);
  }

  return data;
}

export async function deleteCategory(categoryId: string) {
  const client = getSupabaseClient();

  // Check if category has products
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id")
    .eq("category_id", categoryId)
    .limit(1);

  if (productsError) {
    throw new Error("Failed to check category products: " + productsError.message);
  }

  if (products && products.length > 0) {
    throw new Error("Cannot delete category that has products. Please move or delete products first.");
  }

  const { error } = await client
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error("Failed to delete category: " + error.message);
  }

  return { success: true, message: "Category deleted successfully" };
}

// ===== COMPREHENSIVE ANALYSIS FUNCTIONS =====

export async function getComprehensiveCategoryAnalysis() {
  const client = getSupabaseClient();

  // Get all categories
  const { data: categories, error: categoriesError } = await client
    .from("categories")
    .select("id, name, description, created_at")
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error("Failed to fetch comprehensive category data: " + categoriesError.message);
  }

  // Get all products with category information
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id, name, selling_price, current_stock, is_active, category_id");

  if (productsError) {
    throw new Error("Failed to fetch products data: " + productsError.message);
  }

  const categoryData = categories ?? [];
  const productData = products ?? [];
  const totalCategories = categoryData.length;
  
  // Group products by category
  const productsByCategory = productData.reduce((acc, product) => {
    const categoryId = product.category_id as string;
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(product);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate comprehensive statistics
  let totalProducts = 0;
  let totalStockValue = 0;
  let categoriesWithProducts = 0;
  let categoriesWithoutProducts = 0;

  categoryData.forEach(category => {
    const categoryId = category.id as string;
    const products = productsByCategory[categoryId] || [];
    const productCount = products.length;
    
    totalProducts += productCount;
    
    if (productCount > 0) {
      categoriesWithProducts++;
      totalStockValue += products.reduce((sum, p) => sum + ((p.selling_price as number) * (p.current_stock as number)), 0);
    } else {
      categoriesWithoutProducts++;
    }
  });

  // Top categories by product count
  const topCategoriesByProducts = categoryData
    .map(category => {
      const categoryId = category.id as string;
      const products = productsByCategory[categoryId] || [];
      const productCount = products.length;
      const stockValue = products.reduce((sum, p) => sum + ((p.selling_price as number) * (p.current_stock as number)), 0);
      
      return {
        id: category.id,
        name: category.name,
        description: category.description,
        product_count: productCount,
        total_stock_value: stockValue
      };
    })
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 10);

  return {
    summary: {
      total_categories: totalCategories,
      categories_with_products: categoriesWithProducts,
      categories_without_products: categoriesWithoutProducts,
      total_products: totalProducts,
      total_stock_value: totalStockValue,
      average_products_per_category: totalCategories > 0 ? (totalProducts / totalCategories).toFixed(1) : '0'
    },
    top_categories_by_products: topCategoriesByProducts,
    categories_needing_attention: categoryData
      .filter(category => {
        const categoryId = category.id as string;
        const products = productsByCategory[categoryId] || [];
        return products.length === 0;
      })
      .map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        reason: 'No products assigned'
      }))
      .slice(0, 5)
  };
}

export async function getCategoryDashboardStats() {
  const client = getSupabaseClient();

  // Get all categories
  const { data: categoryData, error: categoryError } = await client
    .from("categories")
    .select("id, name, created_at");

  if (categoryError) {
    throw new Error("Failed to fetch category dashboard data: " + categoryError.message);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const todayCategories = categoryData?.filter(c => new Date(c.created_at as string) >= todayStart).length || 0;
  const weekCategories = categoryData?.filter(c => new Date(c.created_at as string) >= weekStart).length || 0;
  const monthCategories = categoryData?.filter(c => new Date(c.created_at as string) >= monthStart).length || 0;
  const lastMonthCategories = categoryData?.filter(c => {
    const createdAt = new Date(c.created_at as string);
    return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
  }).length || 0;

  const growthRate = lastMonthCategories > 0 
    ? ((monthCategories - lastMonthCategories) / lastMonthCategories) * 100
    : monthCategories > 0 ? 100 : 0;

  return {
    quick_stats: {
      total_categories: categoryData?.length || 0,
      today_additions: todayCategories,
      week_additions: weekCategories,
      month_additions: monthCategories,
      growth_rate: growthRate
    },
    trends: {
      last_30_days: Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        const dayCount = categoryData?.filter(c => {
          const createdAt = new Date(c.created_at as string);
          return createdAt >= dateStart && createdAt < dateEnd;
        }).length || 0;

        return {
          date: date.toISOString().substring(0, 10),
          categories_added: dayCount
        };
      })
    }
  };
}
