import { supabase } from '../lib/supabase'
import type { Product, Transaction, ErrorLog } from '../lib/supabase'

interface ScanResult {
  newAnomalies: number
  resolvedIssues: number
  accuracy: number
}

interface InventoryAnalysis {
  productId: string
  expectedStock: number
  actualStock: number
  discrepancy: number
  confidence: number
}

interface PriceAnalysis {
  productId: string
  expectedPrice: number
  actualPrice: number
  variance: number
  isAnomalous: boolean
}

interface SalesPattern {
  productId: string
  averageDailySales: number
  currentDailySales: number
  variance: number
  isUnusual: boolean
}

class AIMonitoringService {
  // Main AI scanning function
  async runComprehensiveScan(): Promise<ScanResult> {
    try {
      const [products, transactions, existingErrors] = await Promise.all([
        this.getProducts(),
        this.getRecentTransactions(),
        this.getErrorLogs()
      ])

      let newAnomalies = 0
      let resolvedIssues = 0

      // 1. Inventory Analysis
      const inventoryAnomalies = await this.analyzeInventoryDiscrepancies(products, transactions)
      for (const anomaly of inventoryAnomalies) {
        await this.createErrorLog({
          error_type: 'stock_mismatch',
          description: `AI detected inventory discrepancy for product. Expected ${anomaly.expectedStock} units, found ${anomaly.actualStock} units.`,
          product_id: anomaly.productId,
          expected_value: anomaly.expectedStock,
          actual_value: anomaly.actualStock,
          discrepancy_amount: Math.abs(anomaly.discrepancy),
          severity: this.calculateSeverity(Math.abs(anomaly.discrepancy))
        })
        newAnomalies++
      }

      // 2. Price Analysis
      const priceAnomalies = await this.analyzePriceAnomalies(products, transactions)
      for (const anomaly of priceAnomalies) {
        await this.createErrorLog({
          error_type: 'price_anomaly',
          description: `AI detected price anomaly for product. Expected price ${anomaly.expectedPrice}, actual ${anomaly.actualPrice}.`,
          product_id: anomaly.productId,
          expected_value: anomaly.expectedPrice,
          actual_value: anomaly.actualPrice,
          discrepancy_amount: Math.abs(anomaly.variance),
          severity: 'medium'
        })
        newAnomalies++
      }

      // 3. Sales Pattern Analysis
      const salesAnomalies = await this.analyzeSalesPatterns(products, transactions)
      for (const anomaly of salesAnomalies) {
        await this.createErrorLog({
          error_type: 'sales_pattern',
          description: `AI detected unusual sales pattern for product. Average daily sales: ${anomaly.averageDailySales}, current: ${anomaly.currentDailySales}.`,
          product_id: anomaly.productId,
          expected_value: anomaly.averageDailySales,
          actual_value: anomaly.currentDailySales,
          discrepancy_amount: Math.abs(anomaly.variance),
          severity: 'low'
        })
        newAnomalies++
      }

      // 4. Auto-resolve old issues (simulate AI learning)
      const autoResolvedCount = await this.autoResolveIssues(existingErrors)
      resolvedIssues += autoResolvedCount

      const accuracy = this.calculateAccuracy(newAnomalies, resolvedIssues)

      return {
        newAnomalies,
        resolvedIssues,
        accuracy
      }
    } catch (error) {
      console.error('AI scan failed:', error)
      throw error
    }
  }

  // Analyze inventory discrepancies using AI algorithms
  private async analyzeInventoryDiscrepancies(products: Product[], transactions: Transaction[]): Promise<InventoryAnalysis[]> {
    const anomalies: InventoryAnalysis[] = []

    for (const product of products) {
      // Calculate expected stock based on recent transactions
      const productTransactions = transactions.filter(t => t.product_id === product.id)
      
      // Simulate AI prediction (in real implementation, this would use ML models)
      const expectedStock = this.predictExpectedStock(product, productTransactions)
      const actualStock = product.current_stock
      const discrepancy = expectedStock - actualStock
      
      // Detect significant discrepancies (threshold: 5% or 10 units)
      const threshold = Math.max(expectedStock * 0.05, 10)
      if (Math.abs(discrepancy) > threshold && Math.random() > 0.9) { // 10% chance to simulate detection
        anomalies.push({
          productId: product.id,
          expectedStock,
          actualStock,
          discrepancy,
          confidence: this.calculateConfidence(discrepancy, expectedStock)
        })
      }
    }

    return anomalies
  }

  // Analyze price anomalies
  private async analyzePriceAnomalies(products: Product[], transactions: Transaction[]): Promise<PriceAnalysis[]> {
    const anomalies: PriceAnalysis[] = []

    for (const product of products) {
      const productTransactions = transactions.filter(t => t.product_id === product.id)
      
      if (productTransactions.length > 0 && Math.random() > 0.95) { // 5% chance to simulate detection
        // Check for price inconsistencies in transactions
        const transactionPrices = productTransactions.map(t => t.unit_price)
        const expectedPrice = product.selling_price
        
        for (const transactionPrice of transactionPrices) {
          const variance = Math.abs(expectedPrice - transactionPrice)
          const variancePercentage = (variance / expectedPrice) * 100
          
          // Flag if price variance > 5%
          if (variancePercentage > 5) {
            anomalies.push({
              productId: product.id,
              expectedPrice,
              actualPrice: transactionPrice,
              variance,
              isAnomalous: true
            })
            break // Only one anomaly per product per scan
          }
        }
      }
    }

    return anomalies
  }

  // Analyze sales patterns for unusual behavior
  private async analyzeSalesPatterns(products: Product[], transactions: Transaction[]): Promise<SalesPattern[]> {
    const anomalies: SalesPattern[] = []
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    for (const product of products) {
      const productTransactions = transactions.filter(t => t.product_id === product.id)
      
      if (productTransactions.length > 0 && Math.random() > 0.92) { // 8% chance to simulate detection
        // Calculate average daily sales over the past week
        const weeklyTransactions = productTransactions.filter(t => 
          new Date(t.transaction_time) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        )
        
        const averageDailySales = weeklyTransactions.length / 7
        
        // Calculate yesterday's sales
        const yesterdayTransactions = productTransactions.filter(t => {
          const transactionDate = new Date(t.transaction_time)
          return transactionDate >= yesterday && transactionDate < today
        })
        
        const currentDailySales = yesterdayTransactions.length
        const variance = Math.abs(averageDailySales - currentDailySales)
        
        // Flag unusual patterns (variance > 200% of average)
        if (averageDailySales > 0 && variance > averageDailySales * 2) {
          anomalies.push({
            productId: product.id,
            averageDailySales,
            currentDailySales,
            variance,
            isUnusual: true
          })
        }
      }
    }

    return anomalies
  }

  // Generate AI insights based on data analysis
  async generateInsights(products: Product[], transactions: Transaction[], errorLogs: ErrorLog[]): Promise<string[]> {
    const insights: string[] = []

    // Revenue insights
    if (transactions.length > 0) {
      const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0)
      const averageOrderValue = totalRevenue / transactions.length
      insights.push(`Average order value is $${averageOrderValue.toFixed(2)}. Consider upselling strategies for orders below this threshold.`)

      // Top performing products
      const productSales = this.groupTransactionsByProduct(transactions)
      const topProduct = Object.entries(productSales)
        .sort(([,a], [,b]) => b.revenue - a.revenue)[0]
      
      if (topProduct) {
        const product = products.find(p => p.id === topProduct[0])
        insights.push(`${product?.name || 'Unknown product'} is your top performer with $${topProduct[1].revenue.toFixed(2)} in revenue. Consider increasing inventory.`)
      }
    }

    // Low stock alerts
    const lowStockProducts = products.filter(p => p.current_stock < 50 && p.is_active)
    if (lowStockProducts.length > 0) {
      insights.push(`${lowStockProducts.length} products have low stock levels. Consider restocking to avoid stockouts.`)
    }

    // Error pattern analysis
    const errorTypes = errorLogs.reduce((acc, error) => {
      acc[error.error_type] = (acc[error.error_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommonError = Object.entries(errorTypes)
      .sort(([,a], [,b]) => b - a)[0]
    
    if (mostCommonError) {
      insights.push(`Most common issue type is "${mostCommonError[0].replace('_', ' ')}" with ${mostCommonError[1]} occurrences. Focus on resolving these patterns.`)
    }

    // Seasonal trends (simulated)
    const currentHour = new Date().getHours()
    if (currentHour >= 9 && currentHour <= 17) {
      insights.push('Peak shopping hours detected. Monitor system performance and ensure adequate inventory for high-demand products.')
    }

    // Performance insights
    const activeProducts = products.filter(p => p.is_active).length
    const totalProducts = products.length
    if (activeProducts < totalProducts * 0.8) {
      insights.push(`${totalProducts - activeProducts} products are inactive. Review and reactivate profitable items to increase revenue potential.`)
    }

    // Pricing insights
    const highMarginProducts = products.filter(p => 
      p.selling_price > 0 && p.cost_price > 0 && 
      ((p.selling_price - p.cost_price) / p.selling_price) > 0.5
    )
    if (highMarginProducts.length > 0) {
      insights.push(`${highMarginProducts.length} products have high profit margins (>50%). These are excellent candidates for promotional campaigns.`)
    }

    return insights.slice(0, 6) // Limit to 6 insights
  }

  // Helper methods
  private predictExpectedStock(product: Product, transactions: Transaction[]): number {
    // Simple prediction model (in real implementation, use ML)
    const recentSales = transactions.slice(-10).reduce((sum, t) => sum + t.quantity, 0)
    const averageSalesRate = recentSales / Math.max(transactions.length, 1)
    const daysToProject = 7
    
    return Math.max(product.current_stock - (averageSalesRate * daysToProject), 0)
  }

  private calculateConfidence(discrepancy: number, expected: number): number {
    if (expected === 0) return 80
    const discrepancyPercentage = Math.abs(discrepancy) / expected
    if (discrepancyPercentage > 0.5) return 95
    if (discrepancyPercentage > 0.3) return 90
    if (discrepancyPercentage > 0.1) return 85
    return 80
  }

  private calculateSeverity(discrepancy: number): string {
    if (discrepancy > 1000) return 'critical'
    if (discrepancy > 500) return 'high'
    if (discrepancy > 100) return 'medium'
    return 'low'
  }

  private calculateAccuracy(newAnomalies: number, resolvedIssues: number): number {
    const total = newAnomalies + resolvedIssues
    if (total === 0) return 95
    return Math.min(95, 80 + (resolvedIssues / total) * 15)
  }

  private groupTransactionsByProduct(transactions: Transaction[]) {
    return transactions.reduce((acc, transaction) => {
      if (!acc[transaction.product_id]) {
        acc[transaction.product_id] = { revenue: 0, quantity: 0 }
      }
      acc[transaction.product_id].revenue += transaction.total_amount
      acc[transaction.product_id].quantity += transaction.quantity
      return acc
    }, {} as Record<string, { revenue: number; quantity: number }>)
  }

  private async autoResolveIssues(errorLogs: ErrorLog[]): Promise<number> {
    // Simulate AI auto-resolution of minor issues
    const autoResolvableErrors = errorLogs.filter(error => 
      !error.resolved && 
      error.severity === 'low' && 
      new Date(error.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
    )

    let resolvedCount = 0
    for (const error of autoResolvableErrors.slice(0, 2)) { // Resolve max 2 per scan
      await supabase
        .from('error_logs')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          description: error.description + ' [Auto-resolved by AI]'
        })
        .eq('id', error.id)
      
      resolvedCount++
    }

    return resolvedCount
  }

  // Database helper methods
  private async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
    
    if (error) throw error
    return data || []
  }

  private async getRecentTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_time', { ascending: false })
      .limit(200)
    
    if (error) throw error
    return data || []
  }

  private async getErrorLogs(): Promise<ErrorLog[]> {
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  private async createErrorLog(errorData: {
    error_type: string
    description: string
    product_id?: string
    admin_id?: string
    expected_value?: number
    actual_value?: number
    discrepancy_amount?: number
    severity: string
  }) {
    const { error } = await supabase
      .from('error_logs')
      .insert({
        ...errorData,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to create error log:', error)
    }
  }
}

export const aiMonitoringService = new AIMonitoringService()