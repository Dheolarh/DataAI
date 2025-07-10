export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationErrors {
  [key: string]: string
}

export function validateField(value: any, rules: ValidationRule): string | null {
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required'
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format'
    }
  }

  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

export function validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationErrors {
  const errors: ValidationErrors = {}

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field])
    if (error) {
      errors[field] = error
    }
  })

  return errors
}

// Common validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+/,
  sku: /^[A-Z0-9\-]+$/,
  currency: /^\d+(\.\d{1,2})?$/
}

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    pattern: validationPatterns.email
  },
  password: {
    required: true,
    minLength: 8
  },
  sku: {
    required: true,
    pattern: validationPatterns.sku,
    minLength: 3,
    maxLength: 20
  },
  price: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value)
      if (isNaN(num) || num < 0) {
        return 'Must be a valid positive number'
      }
      return null
    }
  },
  stock: {
    required: true,
    custom: (value: string) => {
      const num = parseInt(value)
      if (isNaN(num) || num < 0) {
        return 'Must be a valid positive integer'
      }
      return null
    }
  }
}