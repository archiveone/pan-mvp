'use client'

import { AuthProvider } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import LoginPage from '../../pages/LoginPage'

export default function Login() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </ThemeProvider>
  )
}
