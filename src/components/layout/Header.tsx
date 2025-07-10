import React from 'react'
import { ShoppingCart, BarChart3 } from 'lucide-react'

interface HeaderProps {
  title: string
  showLogo?: boolean
}

export const Header: React.FC<HeaderProps> = ({ title, showLogo = true }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {showLogo && (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <ShoppingCart className="h-8 w-8 text-quickcart-600" />
                  <BarChart3 className="h-4 w-4 text-quickcart-500 absolute -top-1 -right-1" />
                </div>
                <span className="text-2xl font-bold text-quickcart-700">QuickCart</span>
              </div>
            )}
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleString('en-US', { 
                timeZone: 'UTC',
                dateStyle: 'medium',
                timeStyle: 'short'
              })} UTC
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}