import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import { OfflineProvider } from './store/OfflineContext'
import { LangProvider } from './store/LangContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StateDashboard from './pages/StateDashboard'
import DistrictDashboard from './pages/DistrictDashboard'
import VillageDashboard from './pages/VillageDashboard'
import CentralDashboard from './pages/CentralDashboard'
import VillageMap from './pages/VillageMap'
import GapDetection from './pages/GapDetection'
import ProjectTracker from './pages/ProjectTracker'
import ReportForm from './pages/ReportForm'
import { Moon, Sun } from 'lucide-react'

function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <AuthProvider>
      <LangProvider>
        <OfflineProvider>
          <Router>
            <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors`}>
              <AppContent darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            </div>
          </Router>
        </OfflineProvider>
      </LangProvider>
    </AuthProvider>
  )
}

function AppContent({ darkMode, toggleDarkMode }) {
  const { user } = useAuth()

  console.log('AppContent - Current user:', user)

  return (
    <>
      {user && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      
      <main className={user ? "pt-16" : ""}>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? (
                user.role === 'village' ? <VillageDashboard /> :
                user.role === 'district' ? <DistrictDashboard /> :
                user.role === 'state' ? <StateDashboard /> :
                user.role === 'central' ? <CentralDashboard /> :
                <Dashboard />
              ) : <Navigate to="/login" />
            }
          />
          <Route 
            path="/map" 
            element={user ? <VillageMap /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/gaps" 
            element={user ? <GapDetection /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/projects" 
            element={user ? <ProjectTracker /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/report" 
            element={user ? <ReportForm /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </main>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-4 right-4 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </>
  )
}

export default App