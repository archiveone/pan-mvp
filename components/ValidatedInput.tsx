'use client'

import { useState, InputHTMLAttributes } from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  showSuccess?: boolean
  onValidate?: (value: string) => { isValid: boolean; error?: string }
}

export function ValidatedInput({
  label,
  error,
  helperText,
  showSuccess = false,
  onValidate,
  type = 'text',
  className = '',
  ...props
}: ValidatedInputProps) {
  const [localError, setLocalError] = useState<string>()
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)
  
  const displayError = error || localError
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)
    
    if (onValidate) {
      const result = onValidate(e.target.value)
      if (!result.isValid && result.error) {
        setLocalError(result.error)
      } else {
        setLocalError(undefined)
      }
    }
    
    props.onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (touched && onValidate) {
      const result = onValidate(e.target.value)
      if (!result.isValid && result.error) {
        setLocalError(result.error)
      } else {
        setLocalError(undefined)
      }
    }
    
    props.onChange?.(e)
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          {...props}
          type={inputType}
          onBlur={handleBlur}
          onChange={handleChange}
          className={`
            w-full px-4 py-3 rounded-lg border
            ${displayError 
              ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
              : showSuccess && touched && !displayError
              ? 'border-green-300 dark:border-green-700 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
            }
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:ring-2
            transition-colors
            ${isPassword ? 'pr-12' : displayError || (showSuccess && touched && !displayError) ? 'pr-12' : ''}
            ${className}
          `}
        />
        
        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
        
        {/* Error icon */}
        {displayError && touched && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
        
        {/* Success icon */}
        {showSuccess && touched && !displayError && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {displayError && touched && (
        <div className="mt-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
        </div>
      )}
      
      {/* Helper text */}
      {helperText && !displayError && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  )
}

export default ValidatedInput

