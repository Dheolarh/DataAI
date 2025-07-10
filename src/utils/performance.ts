// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      const duration = end - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  getMetrics(label: string): {
    average: number
    min: number
    max: number
    count: number
  } | null {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return null

    return {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    }
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    this.metrics.forEach((values, label) => {
      result[label] = this.getMetrics(label)
    })
    
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor(label: string) {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    startTimer: () => monitor.startTimer(label),
    recordMetric: (value: number) => monitor.recordMetric(label, value),
    getMetrics: () => monitor.getMetrics(label)
  }
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number
  total: number
  percentage: number
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    }
  }
  return null
}

// Network performance monitoring
export function measureNetworkLatency(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = performance.now()
    const img = new Image()
    
    img.onload = () => {
      const end = performance.now()
      resolve(end - start)
    }
    
    img.onerror = () => {
      reject(new Error('Network request failed'))
    }
    
    img.src = `${url}?t=${Date.now()}`
  })
}

// Bundle size analyzer
export function analyzeBundleSize(): {
  scripts: number
  stylesheets: number
  totalSize: number
} {
  const scripts = document.querySelectorAll('script[src]').length
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length
  
  // This is a simplified calculation
  // In a real implementation, you'd need to fetch actual file sizes
  const estimatedSize = (scripts * 50 + stylesheets * 20) * 1024 // KB estimate
  
  return {
    scripts,
    stylesheets,
    totalSize: estimatedSize
  }
}