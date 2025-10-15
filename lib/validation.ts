// Comprehensive form validation utilities

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Email validation
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  return { isValid: true }
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; error?: string; strength?: number } {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' }
  }
  
  // Check password strength
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  if (strength < 3) {
    return { 
      isValid: false, 
      error: 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols',
      strength 
    }
  }
  
  return { isValid: true, strength }
}

// Username validation
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  
  if (!username) {
    return { isValid: false, error: 'Username is required' }
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' }
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' }
  }
  
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }
  
  return { isValid: true }
}

// Required field validation
export function validateRequired(value: any, fieldName: string): { isValid: boolean; error?: string } {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  return { isValid: true }
}

// URL validation
export function validateURL(url: string): { isValid: boolean; error?: string } {
  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' }
  }
}

// Phone number validation
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  const digitsOnly = phone.replace(/\D/g, '')
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Please enter a valid phone number' }
  }
  
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Phone number contains invalid characters' }
  }
  
  return { isValid: true }
}

// Price validation
export function validatePrice(price: string | number): { isValid: boolean; error?: string } {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price
  
  if (isNaN(priceNum)) {
    return { isValid: false, error: 'Please enter a valid price' }
  }
  
  if (priceNum < 0) {
    return { isValid: false, error: 'Price cannot be negative' }
  }
  
  if (priceNum > 1000000) {
    return { isValid: false, error: 'Price is too high' }
  }
  
  return { isValid: true }
}

// Text length validation
export function validateLength(
  text: string,
  min: number,
  max: number,
  fieldName: string
): { isValid: boolean; error?: string } {
  if (text.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` }
  }
  
  if (text.length > max) {
    return { isValid: false, error: `${fieldName} must be less than ${max} characters` }
  }
  
  return { isValid: true }
}

// File validation
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'Please select a file' }
  }
  
  // Check file type
  const fileType = file.type
  if (!allowedTypes.some(type => fileType.includes(type))) {
    return { 
      isValid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    }
  }
  
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > maxSizeMB) {
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` }
  }
  
  return { isValid: true }
}

// Image validation
export function validateImage(file: File, maxSizeMB: number = 5): { isValid: boolean; error?: string } {
  return validateFile(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], maxSizeMB)
}

// Video validation
export function validateVideo(file: File, maxSizeMB: number = 100): { isValid: boolean; error?: string } {
  return validateFile(file, ['video/mp4', 'video/quicktime', 'video/webm'], maxSizeMB)
}

// Date validation
export function validateDate(date: string | Date): { isValid: boolean; error?: string } {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' }
  }
  
  return { isValid: true }
}

// Future date validation
export function validateFutureDate(date: string | Date): { isValid: boolean; error?: string } {
  const dateValidation = validateDate(date)
  if (!dateValidation.isValid) return dateValidation
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  
  if (dateObj <= now) {
    return { isValid: false, error: 'Date must be in the future' }
  }
  
  return { isValid: true }
}

// Sanitize HTML/XSS prevention
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Full form validation
export function validateForm(
  data: Record<string, any>,
  rules: Record<string, (value: any) => { isValid: boolean; error?: string }>
): ValidationResult {
  const errors: Record<string, string> = {}
  let isValid = true
  
  for (const [field, validate] of Object.entries(rules)) {
    const result = validate(data[field])
    if (!result.isValid && result.error) {
      errors[field] = result.error
      isValid = false
    }
  }
  
  return { isValid, errors }
}

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validateRequired,
  validateURL,
  validatePhone,
  validatePrice,
  validateLength,
  validateFile,
  validateImage,
  validateVideo,
  validateDate,
  validateFutureDate,
  sanitizeInput,
  validateForm,
}

