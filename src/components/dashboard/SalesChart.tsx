import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { dbService } from '../../lib/supabase'

interface ChartData {
  date: string
  sales: number
  transactions: number
}

export const SalesChart: React.FC = () => {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChartData = async () => {
      try {
        // For now, we'll create mock data based on recent transactions
        // In a real implementation, this would aggregate actual sales data
        const transactions = await dbService.getRecentTransactions(50)
        
        // Group transactions by date
        const groupedData = transactions.reduce((acc, transaction) => {
          const date = new Date(transaction.transaction_time).toLocaleDateString()
          if (!acc[date]) {
            acc[date] = { sales: 0, transactions: 0 }
          }
          acc[date].sales += transaction.total_amount
          acc[date].transactions += 1
          return acc
        }, {} as Record<string, { sales: number; transactions: number }>)

        // Convert to chart format
        const chartData = Object.entries(groupedData)
          .map(([date, data]) => ({
            date,
            sales: data.sales,
            transactions: data.transactions
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-7) // Last 7 days

        setData(chartData)
      } catch (error) {
        console.error('Failed to load chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChartData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'sales' ? `$${value.toFixed(2)}` : value,
                  name === 'sales' ? 'Sales' : 'Transactions'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="sales"
              />
              <Line 
                type="monotone" 
                dataKey="transactions" 
                stroke="#16a34a" 
                strokeWidth={2}
                name="transactions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}