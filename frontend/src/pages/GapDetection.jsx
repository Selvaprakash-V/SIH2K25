import React, { useState, useEffect } from 'react'
import { villageAPI, gapAPI } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { AlertTriangle, TrendingDown, Search, Filter, ExternalLink } from 'lucide-react'

export default function GapDetection() {
  const { user } = useAuth()
  const [villages, setVillages] = useState([])
  const [gaps, setGaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('')
  const [selectedGapType, setSelectedGapType] = useState('')

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      // Filter data based on user role
      const params = {}
      if (user?.role === 'village' && user?.village) {
        params.name = user.village
        params.state = user.state
        params.district = user.district
      } else if (user?.role === 'district' && user?.district) {
        params.district = user.district
        params.state = user.state
      } else if (user?.role === 'state' && user?.state) {
        params.state = user.state
      }
      // Central users see all data (no filtering)

      const [villagesRes, gapsRes] = await Promise.all([
        villageAPI.getVillages(params),
        gapAPI.getGaps(params)
      ])
      
      setVillages(villagesRes.data.villages || villagesRes.data)
      
      // Process gap data
      const villageData = villagesRes.data.villages || villagesRes.data
      const processedGaps = villageData.map(village => {
        return analyzeVillageGaps(village)
      }).filter(gap => gap.gaps.length > 0)
      
      setGaps(processedGaps)
    } catch (error) {
      console.error('Failed to fetch gap data:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeVillageGaps = (village) => {
    const gaps = []
    const amenities = village.amenities
    
    if (!amenities) {
      return { village, gaps: [], severityScore: 0 }
    }
    
    let severityScore = 0

    // Water gap
    if (amenities.water === 0) {
      gaps.push({
        type: 'water',
        severity: 'critical',
        message: 'No water access available',
        priority: 'high',
        impact: 'Immediate health and sanitation risk'
      })
      severityScore += 25
    }

    // Electricity gap
    if (amenities.electricity < 80) {
      const severity = amenities.electricity < 50 ? 'critical' : 'moderate'
      gaps.push({
        type: 'electricity',
        severity,
        message: `Only ${amenities.electricity}% electricity coverage`,
        priority: amenities.electricity < 50 ? 'high' : 'medium',
        impact: 'Limited economic opportunities and quality of life'
      })
      severityScore += (80 - amenities.electricity) * 0.25
    }

    // Education gap
    const requiredSchools = Math.max(1, Math.floor(village.population / 1000))
    if (amenities.schools < requiredSchools) {
      const severity = amenities.schools === 0 ? 'critical' : 'moderate'
      gaps.push({
        type: 'education',
        severity,
        message: `Need ${requiredSchools - amenities.schools} more schools`,
        priority: 'high',
        impact: 'Long-term development and literacy issues'
      })
      severityScore += amenities.schools === 0 ? 15 : 7.5
    }

    // Healthcare gap
    const requiredHealthCenters = Math.max(1, Math.floor(village.population / 5000))
    if (amenities.health_centers < requiredHealthCenters) {
      const severity = amenities.health_centers === 0 ? 'critical' : 'moderate'
      gaps.push({
        type: 'healthcare',
        severity,
        message: `Need ${requiredHealthCenters - amenities.health_centers} more health centers`,
        priority: 'high',
        impact: 'Inadequate medical care access'
      })
      severityScore += amenities.health_centers === 0 ? 20 : 10
    }

    // Sanitation gap
    if (amenities.toilets < 70) {
      const severity = amenities.toilets < 40 ? 'critical' : 'moderate'
      gaps.push({
        type: 'sanitation',
        severity,
        message: `Only ${amenities.toilets}% toilet coverage`,
        priority: 'medium',
        impact: 'Health and hygiene concerns'
      })
      severityScore += (70 - amenities.toilets) * 0.15
    }

    // Connectivity gap
    if (amenities.internet < 50) {
      gaps.push({
        type: 'connectivity',
        severity: 'moderate',
        message: `Only ${amenities.internet}% internet coverage`,
        priority: 'low',
        impact: 'Limited access to digital services and opportunities'
      })
      severityScore += (50 - amenities.internet) * 0.05
    }

    return {
      village,
      gaps,
      severityScore: Math.round(severityScore)
    }
  }

  const getFilteredGaps = () => {
    return gaps.filter(gapData => {
      // Search filter
      if (searchTerm && !gapData.village.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Severity filter
      if (selectedSeverity) {
        const hasSeverity = gapData.gaps.some(gap => gap.severity === selectedSeverity)
        if (!hasSeverity) return false
      }
      
      // Gap type filter
      if (selectedGapType) {
        const hasGapType = gapData.gaps.some(gap => gap.type === selectedGapType)
        if (!hasGapType) return false
      }
      
      return true
    }).sort((a, b) => b.severityScore - a.severityScore)
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getGapTypeIcon = (type) => {
    const icons = {
      water: '💧',
      electricity: '⚡',
      education: '🎓',
      healthcare: '❤️',
      sanitation: '🚿',
      connectivity: '📶'
    }
    return icons[type] || '📋'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filteredGaps = getFilteredGaps()

  // For village users, show only their own village and hide filters
  if (user?.role === 'village') {
    const myVillageGap = gaps.find(gap => gap.village.name === user.village)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Gap Detection for {user.village}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Infrastructure gaps and priorities for your village
            </p>
          </div>
          {myVillageGap ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {myVillageGap.village.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {myVillageGap.village.district}, {myVillageGap.village.state} •
                      Population: {myVillageGap.village.population?.toLocaleString()} •
                      SC Ratio: {myVillageGap.village.sc_ratio}%
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {myVillageGap.severityScore}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Severity Score
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {myVillageGap.gaps.length === 0 ? (
                    <div className="text-green-600 font-semibold">No major gaps detected. Your village is meeting its development targets.</div>
                  ) : (
                    myVillageGap.gaps.map((gap, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getGapTypeIcon(gap.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white capitalize">{gap.type}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(gap.severity)}`}>{gap.severity}</span>
                            </div>
                            <div className="text-gray-700 dark:text-gray-300 text-sm mb-1">{gap.message}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Impact: {gap.impact}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No data found for your village
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please contact your district or state officer to ensure your village data is up to date.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gap Detection Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Identify and prioritize infrastructure gaps across villages
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Villages with Gaps
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gaps.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-bold">C</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Critical Gaps
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gaps.filter(g => g.gaps.some(gap => gap.severity === 'critical')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-bold">M</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Moderate Gaps
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gaps.filter(g => g.gaps.some(gap => gap.severity === 'moderate')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Severity Score
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {gaps.length > 0 ? Math.round(gaps.reduce((sum, g) => sum + g.severityScore, 0) / gaps.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Villages
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by village name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity Level
              </label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="moderate">Moderate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gap Type
              </label>
              <select
                value={selectedGapType}
                onChange={(e) => setSelectedGapType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="water">Water</option>
                <option value="electricity">Electricity</option>
                <option value="education">Education</option>
                <option value="healthcare">Healthcare</option>
                <option value="sanitation">Sanitation</option>
                <option value="connectivity">Connectivity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gap Analysis Results */}
        <div className="space-y-6">
          {filteredGaps.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No gaps found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedSeverity || selectedGapType 
                  ? 'Try adjusting your filters to see more results.'
                  : 'All villages are meeting their development targets.'}
              </p>
            </div>
          ) : (
            filteredGaps.map((gapData) => (
              <div key={gapData.village.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6">
                  {/* Village Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {gapData.village.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {gapData.village.district}, {gapData.village.state} • 
                        Population: {gapData.village.population?.toLocaleString()} • 
                        SC Ratio: {gapData.village.sc_ratio}%
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        {gapData.severityScore}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Severity Score
                      </div>
                    </div>
                  </div>

                  {/* Gaps List */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {gapData.gaps.map((gap, index) => (
                      <div 
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{getGapTypeIcon(gap.type)}</span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                                {gap.type}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(gap.severity)}`}>
                                {gap.severity}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(gap.priority)}`}>
                                {gap.priority} priority
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {gap.message}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Impact: {gap.impact}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Identified {gapData.gaps.length} gap{gapData.gaps.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                          Create Project
                        </button>
                        <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}