import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isNewSession, setIsNewSession] = useState(true)

  useEffect(() => {
    // Check if there's a fresh login session
    const justLoggedIn = sessionStorage.getItem('justLoggedIn')
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (justLoggedIn === 'true' && token && userData) {
      // User just logged in, restore their session
      try {
        setUser(JSON.parse(userData))
        setIsNewSession(false)
        sessionStorage.removeItem('justLoggedIn')
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } else {
      // Clear any old sessions
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      setIsNewSession(true)
    }
    
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials)
      const response = await authAPI.login(credentials)
      console.log('Login response:', response.data)
      const { access_token, user: userData } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      sessionStorage.setItem('justLoggedIn', 'true') // Mark as fresh login
      setUser(userData)
      setIsNewSession(false) // Mark as logged in session
      
      console.log('User set to:', userData)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      }
    }
  }

  const signup = async (userData) => {
    try {
      const response = await authAPI.signup(userData)
      return { success: true, user: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Signup failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsNewSession(true)
  }

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isNewSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}