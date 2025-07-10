import React from 'react'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger': return XCircle
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      case 'info': return Info
      default: return AlertTriangle
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'danger': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'info': return 'text-blue-600'
      default: return 'text-yellow-600'
    }
  }

  const getConfirmButtonVariant = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700 text-white'
      case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white'
      case 'info': return 'bg-blue-600 hover:bg-blue-700 text-white'
      default: return 'bg-yellow-600 hover:bg-yellow-700 text-white'
    }
  }

  const Icon = getIcon()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-${type === 'danger' ? 'red' : type === 'success' ? 'green' : type === 'info' ? 'blue' : 'yellow'}-100 mb-4`}>
          <Icon className={`h-6 w-6 ${getIconColor()}`} />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        
        <div className="flex space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={getConfirmButtonVariant()}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}