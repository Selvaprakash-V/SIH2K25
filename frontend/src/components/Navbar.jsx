import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import { useOffline } from '../store/OfflineContext'
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Briefcase, 
  FileText, 
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { isOnline, pendingReports } = useOffline()
  const location = useLocation()

  // Role-based navigation
  const getNavigation = () => {
    const baseNavigation = [
      { name: t('navbar.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    ]

    // Village functionaries get different navigation
    if (user?.role === 'village') {
      return [
        ...baseNavigation,
        { name: t('navbar.gapDetection'), href: '/gaps', icon: AlertTriangle },
        { name: t('navbar.projects'), href: '/projects', icon: Briefcase },
        { name: 'Upload Village Data', href: '/report', icon: FileText },
      ]
    }

    // District, State, and Central get full navigation
    return [
      ...baseNavigation,
      { name: t('navbar.mapView'), href: '/map', icon: Map },
      { name: t('navbar.gapDetection'), href: '/gaps', icon: AlertTriangle },
      { name: t('navbar.projects'), href: '/projects', icon: Briefcase },
      { name: t('navbar.reportIssue'), href: '/report', icon: FileText },
    ]
  }

  const navigation = getNavigation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed top-0 left-0 right-0 z-40 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="flex items-center">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">RQ</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  RuralIQ
                </span>
              </Link>
            </div>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors ${
                      isActive(item.href)
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} className="mr-1" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - Status and User */}
          <div className="flex items-center space-x-4">
            {/* Network Status */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Wifi size={16} />
                  <span className="hidden sm:inline ml-1 text-xs">{t('navbar.online')}</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <WifiOff size={16} />
                  <span className="hidden sm:inline ml-1 text-xs">{t('navbar.offline')}</span>
                </div>
              )}
              
              {pendingReports.length > 0 && (
                <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
                  {pendingReports.length} {t('navbar.pending')}
                </span>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
              
              <button
                onClick={logout}
                className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}