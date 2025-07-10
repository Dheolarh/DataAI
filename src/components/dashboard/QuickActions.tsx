import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  Building2, 
  Tags, 
  Users, 
  BarChart3,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  action: () => void
  color: string
}

export const QuickActions: React.FC = () => {
  const navigate = useNavigate()

  const quickActions: QuickAction[] = [
    {
      icon: Package,
      label: 'Add Product',
      description: 'Add new product to inventory',
      action: () => navigate('/products'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Building2,
      label: 'Add Company',
      description: 'Register new supplier',
      action: () => navigate('/companies'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      icon: Tags,
      label: 'Add Category',
      description: 'Create product category',
      action: () => navigate('/categories'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: Users,
      label: 'Add Admin',
      description: 'Invite new administrator',
      action: () => navigate('/admins'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      icon: BarChart3,
      label: 'View Analytics',
      description: 'Check business insights',
      action: () => navigate('/analytics'),
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      icon: Zap,
      label: 'AI Monitor',
      description: 'Run system scan',
      action: () => navigate('/monitor'),
      color: 'bg-yellow-500 hover:bg-yellow-600'
    }
  ]

  const systemActions = [
    {
      icon: RefreshCw,
      label: 'Refresh Data',
      action: () => window.location.reload()
    },
    {
      icon: Download,
      label: 'Export Report',
      action: () => navigate('/analytics')
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add New</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`${action.color} text-white p-4 h-auto flex flex-col items-center space-y-2 transition-all duration-200 transform hover:scale-105`}
                >
                  <action.icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* System Actions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">System</h4>
            <div className="flex space-x-3">
              {systemActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}