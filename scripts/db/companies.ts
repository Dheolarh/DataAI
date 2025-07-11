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

// ===== BASIC COMPANY FUNCTIONS =====

export async function getAllCompanies() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch companies: " + error.message);
  }

  return data ?? [];
}

export async function getCompanyById(companyId: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at")
    .eq("id", companyId)
    .single();

  if (error) {
    throw new Error("Failed to fetch company: " + error.message);
  }

  return data;
}

export async function getCompanyByName(companyName: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at")
    .eq("name", companyName)
    .single();

  if (error) {
    throw new Error("Failed to fetch company by name: " + error.message);
  }

  return data;
}

export async function getCompaniesByCountry(country: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at")
    .eq("country", country)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch companies by country: " + error.message);
  }

  return data ?? [];
}

export async function getRecentlyAddedCompanies(days: number = 30) {
  const client = getSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at")
    .gte("created_at", cutoffDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch recently added companies: " + error.message);
  }

  return data ?? [];
}

export async function getRecentlyUpdatedCompanies(days: number = 7) {
  const client = getSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at")
    .gte("updated_at", cutoffDate.toISOString())
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch recently updated companies: " + error.message);
  }

  // Filter out companies where updated_at equals created_at (never been updated)
  const filteredData = (data ?? []).filter(company => {
    const createdAt = new Date(company.created_at as string);
    const updatedAt = new Date(company.updated_at as string);
    return updatedAt.getTime() !== createdAt.getTime();
  });

  return filteredData;
}

// ===== COMPANY ANALYTICS FUNCTIONS =====

export async function getCompanyCountByCountry() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .select("country")
    .order("country");

  if (error) {
    throw new Error("Failed to fetch company count by country: " + error.message);
  }

  // Group by country and count
  const countryGroups = (data ?? []).reduce((acc, company) => {
    const country = company.country as string;
    if (!acc[country]) {
      acc[country] = 0;
    }
    acc[country]++;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(countryGroups).map(([country, count]) => ({
    country,
    company_count: count
  })).sort((a, b) => b.company_count - a.company_count);
}

export async function getCompanyDistributionReport() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, created_at");

  if (error) {
    throw new Error("Failed to fetch company distribution: " + error.message);
  }

  const companies = data ?? [];
  const totalCompanies = companies.length;
  
  // Country distribution
  const countryDistribution = companies.reduce((acc, company) => {
    const country = company.country as string;
    if (!acc[country]) {
      acc[country] = 0;
    }
    acc[country]++;
    return acc;
  }, {} as Record<string, number>);

  // Growth over time (last 12 months)
  const now = new Date();
  const monthlyGrowth: { month: string; companies_added: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthlyCount = companies.filter(company => {
      const createdAt = new Date(company.created_at as string);
      return createdAt >= monthStart && createdAt <= monthEnd;
    }).length;

    monthlyGrowth.push({
      month: monthStart.toISOString().substring(0, 7),
      companies_added: monthlyCount
    });
  }

  return {
    total_companies: totalCompanies,
    country_distribution: Object.entries(countryDistribution).map(([country, count]) => ({
      country,
      count,
      percentage: ((count / totalCompanies) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count),
    monthly_growth: monthlyGrowth,
    top_countries: Object.entries(countryDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }))
  };
}

export async function getCompanyCreationTrends(days: number = 30) {
  const client = getSupabaseClient();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from("companies")
    .select("created_at")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch company creation trends: " + error.message);
  }

  // Group by date
  const dailyCreations = (data ?? []).reduce((acc, company) => {
    const date = new Date(company.created_at as string).toISOString().substring(0, 10);
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

  const trends: { date: string; companies_created: number }[] = [];
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const dateString = currentDate.toISOString().substring(0, 10);
    
    trends.push({
      date: dateString,
      companies_created: dailyCreations[dateString] || 0
    });
  }

  const totalCreated = Object.values(dailyCreations).reduce((sum, count) => sum + count, 0);
  const averagePerDay = totalCreated / days;

  return {
    trends,
    summary: {
      total_companies_created: totalCreated,
      average_per_day: Math.round(averagePerDay * 100) / 100,
      period_days: days
    }
  };
}

// ===== COMPANY SEARCH FUNCTIONS =====

export async function searchCompanies(searchTerm: string) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at")
    .or(`name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to search companies: " + error.message);
  }

  return data ?? [];
}

export async function advancedCompanySearch(options: {
  name?: string;
  country?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
}) {
  const client = getSupabaseClient();

  let query = client
    .from("companies")
    .select("id, name, country, contact_info, created_at, updated_at");

  if (options.name) {
    query = query.ilike("name", `%${options.name}%`);
  }

  if (options.country) {
    query = query.eq("country", options.country);
  }

  if (options.hasEmail) {
    query = query.not("contact_info->email", "is", null);
  }

  if (options.hasPhone) {
    query = query.not("contact_info->phone", "is", null);
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
    throw new Error("Failed to perform advanced company search: " + error.message);
  }

  return data ?? [];
}

export async function getCompaniesWithProducts() {
  const client = getSupabaseClient();

  // Get companies with their product count
  const { data, error } = await client
    .from("companies")
    .select(`
      id,
      name,
      country,
      contact_info,
      created_at,
      products!inner(id)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch companies with products: " + error.message);
  }

  // Group by company and count products
  const companiesMap = new Map();
  
  (data ?? []).forEach(company => {
    const companyId = company.id as string;
    if (!companiesMap.has(companyId)) {
      companiesMap.set(companyId, {
        id: company.id,
        name: company.name,
        country: company.country,
        contact_info: company.contact_info,
        created_at: company.created_at,
        product_count: 0
      });
    }
    companiesMap.get(companyId).product_count++;
  });

  return Array.from(companiesMap.values());
}

export async function getCompaniesWithoutProducts() {
  const client = getSupabaseClient();

  // Get all companies
  const { data: allCompanies, error: allCompaniesError } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at");

  if (allCompaniesError) {
    throw new Error("Failed to fetch all companies: " + allCompaniesError.message);
  }

  // Get unique company IDs that have products
  const { data: productsData, error: productsError } = await client
    .from("products")
    .select("company_id");

  if (productsError) {
    throw new Error("Failed to fetch products data: " + productsError.message);
  }

  const companiesWithProductsIds = new Set(productsData?.map(p => p.company_id as string) || []);

  // Filter companies without products
  return (allCompanies ?? []).filter(company => 
    !companiesWithProductsIds.has(company.id as string)
  );
}

export async function getTopCompaniesByProductCount(limit: number = 10) {
  const client = getSupabaseClient();

  // Get companies with their product count using a more reliable approach
  const { data, error } = await client
    .from("companies")
    .select(`
      id,
      name,
      country,
      contact_info,
      products!inner(id)
    `)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Failed to fetch top companies by product count: " + error.message);
  }

  // Group by company and count products
  const companiesMap = new Map();
  
  (data ?? []).forEach(company => {
    const companyId = company.id as string;
    if (!companiesMap.has(companyId)) {
      companiesMap.set(companyId, {
        id: company.id,
        name: company.name,
        country: company.country,
        contact_info: company.contact_info,
        product_count: 0
      });
    }
    companiesMap.get(companyId).product_count++;
  });

  return Array.from(companiesMap.values())
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, limit);
}

export async function getCompanyProductAnalysis(companyId: string) {
  const client = getSupabaseClient();

  // Get company details
  const { data: company, error: companyError } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at")
    .eq("id", companyId)
    .single();

  if (companyError) {
    throw new Error("Failed to fetch company: " + companyError.message);
  }

  // Get products for this company
  const { data: products, error: productsError } = await client
    .from("products")
    .select(`
      id,
      name,
      sku,
      selling_price,
      current_stock,
      is_active,
      categories!inner(name)
    `)
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (productsError) {
    throw new Error("Failed to fetch company products: " + productsError.message);
  }

  // Calculate analytics
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.is_active).length || 0;
  const inactiveProducts = totalProducts - activeProducts;
  const totalStockValue = products?.reduce((sum, p) => sum + ((p.selling_price as number) * (p.current_stock as number)), 0) || 0;
  const averagePrice = totalProducts > 0 ? (products?.reduce((sum, p) => sum + (p.selling_price as number), 0) || 0) / totalProducts : 0;
  const totalStock = products?.reduce((sum, p) => sum + (p.current_stock as number), 0) || 0;
  const outOfStockProducts = products?.filter(p => (p.current_stock as number) === 0).length || 0;

  // Category distribution
  const categoryDistribution = products?.reduce((acc, product) => {
    const categoryName = (product.categories as any)?.name || 'Unknown';
    if (!acc[categoryName]) {
      acc[categoryName] = 0;
    }
    acc[categoryName]++;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    company,
    products: products || [],
    analytics: {
      total_products: totalProducts,
      active_products: activeProducts,
      inactive_products: inactiveProducts,
      out_of_stock_products: outOfStockProducts,
      total_stock_value: totalStockValue,
      average_product_price: averagePrice,
      total_stock_quantity: totalStock,
      category_distribution: Object.entries(categoryDistribution).map(([category, count]) => ({
        category,
        product_count: count,
        percentage: ((count / totalProducts) * 100).toFixed(1)
      })).sort((a, b) => b.product_count - a.product_count)
    }
  };
}

// ===== COMPANY MANAGEMENT FUNCTIONS =====

export async function createCompany(companyData: {
  name: string;
  country: string;
  contact_info?: Record<string, any>;
}) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .insert({
      name: companyData.name,
      country: companyData.country,
      contact_info: companyData.contact_info || {}
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to create company: " + error.message);
  }

  return data;
}

export async function updateCompany(companyId: string, updates: {
  name?: string;
  country?: string;
  contact_info?: Record<string, any>;
}) {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("companies")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update company: " + error.message);
  }

  return data;
}

export async function deleteCompany(companyId: string) {
  const client = getSupabaseClient();

  // First check if company has products
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id")
    .eq("company_id", companyId)
    .limit(1);

  if (productsError) {
    throw new Error("Failed to check company products: " + productsError.message);
  }

  if (products && products.length > 0) {
    throw new Error("Cannot delete company: Company has associated products. Please remove all products first.");
  }

  const { error } = await client
    .from("companies")
    .delete()
    .eq("id", companyId);

  if (error) {
    throw new Error("Failed to delete company: " + error.message);
  }

  return { success: true };
}

export async function updateCompanyContactInfo(companyId: string, contactInfo: Record<string, any>) {
  const client = getSupabaseClient();

  // Get current contact info
  const { data: currentData, error: fetchError } = await client
    .from("companies")
    .select("contact_info")
    .eq("id", companyId)
    .single();

  if (fetchError) {
    throw new Error("Failed to fetch current contact info: " + fetchError.message);
  }

  // Merge with existing contact info
  const mergedContactInfo = {
    ...(currentData.contact_info || {}),
    ...contactInfo
  };

  const { data, error } = await client
    .from("companies")
    .update({
      contact_info: mergedContactInfo,
      updated_at: new Date().toISOString()
    })
    .eq("id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update company contact info: " + error.message);
  }

  return data;
}

// ===== COMPREHENSIVE ANALYSIS FUNCTIONS =====

export async function getComprehensiveCompanyAnalysis() {
  const client = getSupabaseClient();

  // Get all companies
  const { data: companies, error: companiesError } = await client
    .from("companies")
    .select("id, name, country, contact_info, created_at")
    .order("name", { ascending: true });

  if (companiesError) {
    throw new Error("Failed to fetch comprehensive company data: " + companiesError.message);
  }

  // Get all products with company information
  const { data: products, error: productsError } = await client
    .from("products")
    .select("id, name, selling_price, current_stock, is_active, company_id");

  if (productsError) {
    throw new Error("Failed to fetch products data: " + productsError.message);
  }

  const companyData = companies ?? [];
  const productData = products ?? [];
  const totalCompanies = companyData.length;
  
  // Group products by company
  const productsByCompany = productData.reduce((acc, product) => {
    const companyId = product.company_id as string;
    if (!acc[companyId]) {
      acc[companyId] = [];
    }
    acc[companyId].push(product);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate comprehensive statistics
  let totalProducts = 0;
  let totalStockValue = 0;
  let companiesWithProducts = 0;
  let companiesWithoutProducts = 0;
  const countryStats: Record<string, { count: number; product_count: number }> = {};

  companyData.forEach(company => {
    const companyId = company.id as string;
    const products = productsByCompany[companyId] || [];
    const productCount = products.length;
    
    totalProducts += productCount;
    
    if (productCount > 0) {
      companiesWithProducts++;
      totalStockValue += products.reduce((sum, p) => sum + ((p.selling_price as number) * (p.current_stock as number)), 0);
    } else {
      companiesWithoutProducts++;
    }

    // Country statistics
    const country = company.country as string;
    if (!countryStats[country]) {
      countryStats[country] = { count: 0, product_count: 0 };
    }
    countryStats[country].count++;
    countryStats[country].product_count += productCount;
  });

  // Top companies by product count
  const topCompaniesByProducts = companyData
    .map(company => {
      const companyId = company.id as string;
      const products = productsByCompany[companyId] || [];
      const productCount = products.length;
      const stockValue = products.reduce((sum, p) => sum + ((p.selling_price as number) * (p.current_stock as number)), 0);
      
      return {
        id: company.id,
        name: company.name,
        country: company.country,
        product_count: productCount,
        total_stock_value: stockValue
      };
    })
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 10);

  // Country rankings
  const countryRankings = Object.entries(countryStats)
    .map(([country, stats]) => ({
      country,
      company_count: stats.count,
      total_products: stats.product_count,
      average_products_per_company: stats.count > 0 ? (stats.product_count / stats.count).toFixed(1) : '0'
    }))
    .sort((a, b) => b.company_count - a.company_count);

  return {
    summary: {
      total_companies: totalCompanies,
      companies_with_products: companiesWithProducts,
      companies_without_products: companiesWithoutProducts,
      total_products: totalProducts,
      total_stock_value: totalStockValue,
      average_products_per_company: totalCompanies > 0 ? (totalProducts / totalCompanies).toFixed(1) : '0',
      unique_countries: Object.keys(countryStats).length
    },
    top_companies_by_products: topCompaniesByProducts,
    country_rankings: countryRankings,
    companies_needing_attention: companyData
      .filter(company => {
        const companyId = company.id as string;
        const products = productsByCompany[companyId] || [];
        return products.length === 0;
      })
      .map(company => ({
        id: company.id,
        name: company.name,
        country: company.country,
        created_at: company.created_at,
        issue: 'No products associated'
      }))
  };
}

export async function getCompanyDashboardStats() {
  const client = getSupabaseClient();

  // Get basic company stats
  const { data: companies, error } = await client
    .from("companies")
    .select("id, name, country, created_at");

  if (error) {
    throw new Error("Failed to fetch company dashboard stats: " + error.message);
  }

  const companyData = companies ?? [];
  const totalCompanies = companyData.length;
  
  // Calculate time-based stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const todayCompanies = companyData.filter(c => new Date(c.created_at as string) >= todayStart).length;
  const weekCompanies = companyData.filter(c => new Date(c.created_at as string) >= weekStart).length;
  const monthCompanies = companyData.filter(c => new Date(c.created_at as string) >= monthStart).length;
  const lastMonthCompanies = companyData.filter(c => {
    const createdAt = new Date(c.created_at as string);
    return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
  }).length;

  // Calculate growth rate
  const growthRate = lastMonthCompanies > 0 
    ? ((monthCompanies - lastMonthCompanies) / lastMonthCompanies) * 100
    : monthCompanies > 0 ? 100 : 0;

  // Country distribution
  const countryDistribution = companyData.reduce((acc, company) => {
    const country = company.country as string;
    if (!acc[country]) {
      acc[country] = 0;
    }
    acc[country]++;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(countryDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([country, count]) => ({
      country,
      count,
      percentage: ((count / totalCompanies) * 100).toFixed(1)
    }));

  return {
    quick_stats: {
      total_companies: totalCompanies,
      today_additions: todayCompanies,
      week_additions: weekCompanies,
      month_additions: monthCompanies,
      growth_rate: growthRate
    },
    distribution: {
      total_countries: Object.keys(countryDistribution).length,
      top_countries: topCountries
    },
    trends: {
      last_30_days: Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        
        const dayCount = companyData.filter(c => {
          const createdAt = new Date(c.created_at as string);
          return createdAt >= dateStart && createdAt < dateEnd;
        }).length;

        return {
          date: date.toISOString().substring(0, 10),
          companies_added: dayCount
        };
      })
    }
  };
}
