import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Clock, Minus } from 'lucide-react'
import { cn } from '../../utils/cn'

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'pending' | 'neutral'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-100',
          dotColor: 'bg-green-500'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600 bg-red-100',
          dotColor: 'bg-red-500'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 bg-yellow-100',
          dotColor: 'bg-yellow-500'
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'text-blue-600 bg-blue-100',
          dotColor: 'bg-blue-500'
        }
      case 'neutral':
      default:
        return {
          icon: Minus,
          color: 'text-gray-600 bg-gray-100',
          dotColor: 'bg-gray-500'
        }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'h-3 w-3',
          dot: 'h-2 w-2'
        }
      case 'lg':
        return {
          container: 'px-3 py-2 text-base',
          icon: 'h-5 w-5',
          dot: 'h-3 w-3'
        }
      case 'md':
      default:
        return {
          container: 'px-2.5 py-1.5 text-sm',
          icon: 'h-4 w-4',
          dot: 'h-2.5 w-2.5'
        }
    }
  }

  const config = getStatusConfig()
  const sizeClasses = getSizeClasses()
  const Icon = config.icon

  if (label) {
    return (
      <span className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.color,
        sizeClasses.container,
        className
      )}>
        {showIcon && <Icon className={cn(sizeClasses.icon, 'mr-1.5')} />}
        {label}
      </span>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      {showIcon ? (
        <Icon className={cn(sizeClasses.icon, config.color.split(' ')[0])} />
      ) : (
        <div className={cn(
          'rounded-full',
          config.dotColor,
          sizeClasses.dot
        )} />
      )}
    </div>
  )
}