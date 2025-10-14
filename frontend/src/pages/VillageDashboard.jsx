import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { villageAPI, gapAPI, projectAPI } from '../services/api'
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
  Wifi,
  Eye,
  X
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

import { useAuth } from '../store/AuthContext';

export default function VillageDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVillages: 1, // Village functionary manages only 1 village
    criticalGaps: 0,
    completedProjects: 0,
    avgDevelopmentIndex: 0
  })
  const [villageData, setVillageData] = useState(null)
  const [gapData, setGapData] = useState([])
  const [problemTableData, setProblemTableData] = useState([])
  const [filteredProblemData, setFilteredProblemData] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.village) {
      fetchVillageData()
    }
  }, [user])

  const fetchVillageData = async () => {
    try {
      // Fetch only the village functionary's village data
      const villageParams = { name: user.village };
      
      const [villagesRes, gapsRes] = await Promise.all([
        villageAPI.getVillages(villageParams),
        gapAPI.getGaps(villageParams)
      ])

      let villages = villagesRes.data.villages || villagesRes.data
      // Ensure we only get the specific village
      const myVillage = villages.find(v => v.name === user.village) || villages[0]
      setVillageData(myVillage)

      if (myVillage) {
        // Calculate stats for this single village
        const criticalGaps = (myVillage.amenities && (
          myVillage.amenities.water === 0 || 
          myVillage.amenities.electricity < 50 || 
          myVillage.amenities.schools === 0
        )) ? 1 : 0

        setStats({
          totalVillages: 1,
          criticalGaps,
          completedProjects: 0, // TODO: Get from projects API
          avgDevelopmentIndex: calculateDevelopmentIndex(myVillage)
        })

        // Prepare gap analysis data for this village
        const gaps = analyzeVillageGaps(myVillage)
        setGapData(gaps)

        // Generate problem table data for this village
        const problemData = generateVillageProblemData(myVillage)
        setProblemTableData(problemData)
        setFilteredProblemData(problemData)
      }

    } catch (error) {
      console.error('Failed to fetch village data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDevelopmentIndex = (village) => {
    if (!village.amenities) return 0
    
    const amenities = village.amenities
    const score = (
      (amenities.water * 25) +
      (amenities.electricity * 0.2) +
      (amenities.schools > 0 ? 15 : 0) +
      (amenities.health_centers > 0 ? 20 : 0) +
      (amenities.toilets * 0.15) +
      (amenities.internet * 0.05)
    )
    
    return Math.min(100, Math.round(score))
  }

  const analyzeVillageGaps = (village) => {
    const gaps = {
      water: 0,
      electricity: 0,
      education: 0,
      healthcare: 0,
      sanitation: 0,
      connectivity: 0
    }

    if (!village.amenities) return []
    
    const amenities = village.amenities
    if (amenities.water === 0) gaps.water = 1
    if (amenities.electricity < 80) gaps.electricity = 1
    if (amenities.schools === 0) gaps.education = 1
    if (amenities.health_centers === 0) gaps.healthcare = 1
    if (amenities.toilets < 70) gaps.sanitation = 1
    if (amenities.internet < 50) gaps.connectivity = 1

    return Object.entries(gaps).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      hasGap: value,
      percentage: value * 100
    }))
  }

  const generateVillageProblemData = (village) => {
    const problemData = []

    if (!village.amenities) return problemData

    const amenities = village.amenities
    const problems = []

    if (amenities.water === 0) {
      problems.push({
        problem: "No Water Access",
        village: village.name,
        state: village.state,
        peopleAffected: village.population,
        scRatio: village.sc_ratio,
        severity: "Critical",
        status: "Reported", // Default status
        villageId: village.id
      })
    }

    if (amenities.electricity < 50) {
      problems.push({
        problem: "Poor Electricity Coverage",
        village: village.name,
        state: village.state,
        peopleAffected: Math.round(village.population * (1 - amenities.electricity / 100)),
        scRatio: village.sc_ratio,
        severity: "Critical",
        status: "In Progress",
        villageId: village.id
      })
    } else if (amenities.electricity < 80) {
      problems.push({
        problem: "Inadequate Electricity Coverage",
        village: village.name,
        state: village.state,
        peopleAffected: Math.round(village.population * (1 - amenities.electricity / 100)),
        scRatio: village.sc_ratio,
        severity: "Moderate",
        status: "Need Approval",
        villageId: village.id
      })
    }

    if (amenities.schools === 0) {
      problems.push({
        problem: "No Schools Available",
        village: village.name,
        state: village.state,
        peopleAffected: Math.round(village.population * 0.2),
        scRatio: village.sc_ratio,
        severity: "Critical",
        status: "Fund Allocated",
        villageId: village.id
      })
    }

    if (amenities.health_centers === 0) {
      problems.push({
        problem: "No Healthcare Facilities",
        village: village.name,
        state: village.state,
        peopleAffected: village.population,
        scRatio: village.sc_ratio,
        severity: "Critical",
        status: "Completed",
        villageId: village.id
      })
    }

    if (amenities.toilets < 40) {
      problems.push({
        problem: "Poor Sanitation Coverage",
        village: village.name,
        state: village.state,
        peopleAffected: Math.round(village.population * (1 - amenities.toilets / 100)),
        scRatio: village.sc_ratio,
        severity: "Critical",
        status: "Reported",
        villageId: village.id
      })
    } else if (amenities.toilets < 70) {
      problems.push({
        problem: "Inadequate Sanitation Coverage",
        village: village.name,
        state: village.state,
        peopleAffected: Math.round(village.population * (1 - amenities.toilets / 100)),
        scRatio: village.sc_ratio,
        severity: "Moderate",
        status: "In Progress",
        villageId: village.id
      })
    }

    if (amenities.internet < 50) {
      problems.push({
        problem: "Poor Internet Connectivity",
        village: village.name,
        state: village.state,
        peopleAffected: Math.round(village.population * (1 - amenities.internet / 100)),
        scRatio: village.sc_ratio,
        severity: "Moderate",
        status: "Need Approval",
        villageId: village.id
      })
    }

    return problems
  }

  const handleCheckStatus = (problem) => {
    setSelectedProblem(problem)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProblem(null)
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'fund allocated':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'need approval':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'reported':
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

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
            Village Dashboard - {user?.village}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Managing data and problems for {user?.village} village
          </p>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Role:</span> Village Functionary
          </div>
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
                  My Village
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.village}
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
                  Critical Issues
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
                  Population
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {villageData?.population?.toLocaleString()}
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
                  Development Index
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgDevelopmentIndex}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Village Amenities Overview */}
        {villageData?.amenities && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Village Amenities Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Water Supply', value: villageData.amenities.water, icon: Droplets, unit: '%' },
                { name: 'Electricity', value: villageData.amenities.electricity, icon: Zap, unit: '%' },
                { name: 'Schools', value: villageData.amenities.schools, icon: GraduationCap, unit: '' },
                { name: 'Health Centers', value: villageData.amenities.health_centers, icon: Heart, unit: '' },
                { name: 'Sanitation', value: villageData.amenities.toilets, icon: Building, unit: '%' },
                { name: 'Internet', value: villageData.amenities.internet, icon: Wifi, unit: '%' }
              ].map((amenity, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <amenity.icon className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {amenity.name}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {amenity.value}{amenity.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Problems Status Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Village Problems & Status
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    People Affected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProblemData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.problem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.peopleAffected?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.severity === 'Critical' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleCheckStatus(item)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProblemData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No problems detected in your village
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Problem Details Modal - Status Only */}
        {showModal && selectedProblem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Problem Details & Status
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Problem Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Problem:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.problem}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Village:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.village}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">People Affected:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.peopleAffected?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">Severity:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedProblem.severity === 'Critical' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {selectedProblem.severity}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Current Status:</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedProblem.status)}`}>
                          {selectedProblem.status}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        {selectedProblem.status === 'Reported' && 'Problem has been reported to district authorities.'}
                        {selectedProblem.status === 'In Progress' && 'Work is currently in progress to resolve this issue.'}
                        {selectedProblem.status === 'Need Approval' && 'Waiting for approval from higher authorities.'}
                        {selectedProblem.status === 'Fund Allocated' && 'Funding has been allocated for this problem.'}
                        {selectedProblem.status === 'Completed' && 'This problem has been successfully resolved.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
