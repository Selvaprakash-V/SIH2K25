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
    <nav className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 shadow-xl fixed top-0 left-0 right-0 z-40 backdrop-blur-lg bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/dashboard" className="flex items-center group">
                <div className="h-10 w-10 relative">
                  <div className="absolute inset-0 bg-white rounded-full group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <div className="h-4 w-4 bg-orange-500 rounded-full border-2 border-white" />
                  </div>
                </div>
                <span className="ml-3 text-xl font-bold text-white drop-shadow-lg">
                  RuralIQ
                </span>
              </Link>
            </div>
            
            <div className="hidden md:ml-10 md:flex md:space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive(item.href)
                        ? 'bg-white/30 backdrop-blur-md text-white shadow-lg border border-white/40'
                        : 'text-white/80 hover:bg-white/20 hover:text-white border border-transparent hover:border-white/20'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
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
                <div className="flex items-center text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                  <Wifi size={14} />
                  <span className="hidden sm:inline ml-1.5 text-xs font-medium">{t('navbar.online')}</span>
                </div>
              ) : (
                <div className="flex items-center text-white bg-red-500/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-400/40">
                  <WifiOff size={14} />
                  <span className="hidden sm:inline ml-1.5 text-xs font-medium">{t('navbar.offline')}</span>
                </div>
              )}
              
              {pendingReports.length > 0 && (
                <span className="bg-yellow-400/90 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
                  {pendingReports.length} {t('navbar.pending')}
                </span>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30">
                <div className="text-sm font-semibold text-white drop-shadow">
                  {user?.name}
                </div>
                <div className="text-xs text-white/80 capitalize">
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
              
              <button
                onClick={logout}
                className="bg-white/20 backdrop-blur-md p-2.5 rounded-lg text-white hover:bg-white/30 hover:shadow-lg transition-all border border-white/30"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white/10 backdrop-blur-lg border-t border-white/20">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? 'bg-white/30 backdrop-blur-md text-white shadow-lg border border-white/40'
                    : 'text-white/80 hover:bg-white/20 hover:text-white border border-transparent'
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