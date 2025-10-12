import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { villageAPI, gapAPI } from '../services/api'
import { 
  Users, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Building,
  Droplets,
  Zap,
  GraduationCap,
  Heart,
  Wifi
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVillages: 0,
    criticalGaps: 0,
    completedProjects: 0,
    avgDevelopmentIndex: 0
  })
  const [villages, setVillages] = useState([])
  const [gapData, setGapData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [villagesRes, gapsRes] = await Promise.all([
        villageAPI.getVillages(),
        gapAPI.getGaps()
      ])

      const villageData = villagesRes.data
      setVillages(villageData)

      // Calculate stats
      const totalVillages = villageData.length
      const criticalGaps = villageData.filter(v => 
        v.amenities && (
          v.amenities.water === 0 || 
          v.amenities.electricity < 50 || 
          v.amenities.schools === 0
        )
      ).length

      setStats({
        totalVillages,
        criticalGaps,
        completedProjects: Math.floor(totalVillages * 0.3), // Mock data
        avgDevelopmentIndex: calculateAvgDevelopmentIndex(villageData)
      })

      // Prepare gap analysis data
      const gaps = analyzeGaps(villageData)
      setGapData(gaps)

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAvgDevelopmentIndex = (villages) => {
    if (villages.length === 0) return 0
    
    const total = villages.reduce((sum, village) => {
      if (!village.amenities) return sum
      
      const amenities = village.amenities
      const score = (
        (amenities.water * 25) +
        (amenities.electricity * 0.2) +
        (amenities.schools > 0 ? 15 : 0) +
        (amenities.health_centers > 0 ? 20 : 0) +
        (amenities.toilets * 0.15) +
        (amenities.internet * 0.05)
      )
      
      return sum + Math.min(100, score)
    }, 0)
    
    return Math.round(total / villages.length)
  }

  const analyzeGaps = (villages) => {
    const gaps = {
      water: 0,
      electricity: 0,
      education: 0,
      healthcare: 0,
      sanitation: 0,
      connectivity: 0
    }

    villages.forEach(village => {
      if (!village.amenities) return
      
      const amenities = village.amenities
      if (amenities.water === 0) gaps.water++
      if (amenities.electricity < 80) gaps.electricity++
      if (amenities.schools === 0) gaps.education++
      if (amenities.health_centers === 0) gaps.healthcare++
      if (amenities.toilets < 70) gaps.sanitation++
      if (amenities.internet < 50) gaps.connectivity++
    })

    return Object.entries(gaps).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      villages: value,
      percentage: villages.length > 0 ? Math.round((value / villages.length) * 100) : 0
    }))
  }

  const getStateDistribution = () => {
    const stateCount = villages.reduce((acc, village) => {
      acc[village.state] = (acc[village.state] || 0) + 1
      return acc
    }, {})

    return Object.entries(stateCount).map(([state, count]) => ({
      name: state,
      value: count
    }))
  }

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Village Development Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and track rural development progress across SC-majority villages
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Villages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalVillages}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Critical Gaps
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.criticalGaps}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Projects Done
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completedProjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Dev Index
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgDevelopmentIndex}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gap Analysis Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gap Analysis by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'villages' ? 'Villages Affected' : name]}
                />
                <Bar dataKey="villages" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* State Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Villages by State
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getStateDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getStateDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link 
            to="/map"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  View Village Map
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore villages on interactive map
                </p>
              </div>
            </div>
          </Link>

          <Link 
            to="/gaps"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 group-hover:text-red-700" />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Gap Detection
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Identify critical infrastructure gaps
                </p>
              </div>
            </div>
          </Link>

          <Link 
            to="/report"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600 group-hover:text-green-700" />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Report Issue
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Submit community feedback
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Villages Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Villages Overview
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Village
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Population
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    SC Ratio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Key Gaps
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {villages.slice(0, 5).map((village) => (
                  <tr key={village.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {village.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {village.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {village.population?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {village.sc_ratio}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex space-x-1">
                        {village.amenities?.water === 0 && (
                          <span className="text-blue-600" title="Water">💧</span>
                        )}
                        {village.amenities?.electricity < 80 && (
                          <span className="text-yellow-600" title="Electricity">⚡</span>
                        )}
                        {village.amenities?.schools === 0 && (
                          <span className="text-green-600" title="Education">🎓</span>
                        )}
                        {village.amenities?.health_centers === 0 && (
                          <span className="text-red-600" title="Healthcare">❤️</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}