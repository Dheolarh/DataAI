export interface ExportColumn {
  key: string
  header: string
  formatter?: (value: any) => string
}

export function exportToCSV(data: any[], columns: ExportColumn[], filename: string) {
  // Create CSV header
  const headers = columns.map(col => col.header).join(',')
  
  // Create CSV rows
  const rows = data.map(row => 
    columns.map(col => {
      let value = row[col.key]
      
      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value)
      }
      
      // Escape commas and quotes
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""')
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`
        }
      }
      
      return value || ''
    }).join(',')
  )
  
  // Combine headers and rows
  const csvContent = [headers, ...rows].join('\n')
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function exportToJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function generateReport(data: {
  title: string
  summary: Record<string, any>
  tables: Array<{
    title: string
    data: any[]
    columns: ExportColumn[]
  }>
}, filename: string) {
  let content = `${data.title}\n`
  content += `Generated: ${new Date().toLocaleString()}\n\n`
  
  // Add summary
  content += 'SUMMARY\n'
  content += '========\n'
  Object.entries(data.summary).forEach(([key, value]) => {
    content += `${key}: ${value}\n`
  })
  content += '\n'
  
  // Add tables
  data.tables.forEach(table => {
    content += `${table.title.toUpperCase()}\n`
    content += '='.repeat(table.title.length) + '\n'
    
    // Create table
    const headers = table.columns.map(col => col.header).join('\t')
    content += headers + '\n'
    content += '-'.repeat(headers.length) + '\n'
    
    table.data.forEach(row => {
      const rowData = table.columns.map(col => {
        let value = row[col.key]
        if (col.formatter) {
          value = col.formatter(value)
        }
        return value || ''
      }).join('\t')
      content += rowData + '\n'
    })
    content += '\n'
  })
  
  // Download as text file
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.txt`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}