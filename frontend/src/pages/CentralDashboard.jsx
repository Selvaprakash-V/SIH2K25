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
  Edit,
  X,
  Globe
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
  Cell,
  LineChart,
  Line
} from 'recharts'

import { useAuth } from '../store/AuthContext';

export default function CentralDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVillages: 0,
    totalStates: 0,
    totalDistricts: 0,
    criticalGaps: 0,
    completedProjects: 0,
    avgDevelopmentIndex: 0
  })
  const [villages, setVillages] = useState([])
  const [gapData, setGapData] = useState([])
  const [problemTableData, setProblemTableData] = useState([])
  const [filteredProblemData, setFilteredProblemData] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [projectDetails, setProjectDetails] = useState({
    budget: '',
    description: '',
    timeline: '',
    priority: 'Medium',
    contactPerson: '',
    phoneNumber: '',
    additionalNotes: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNationalData()
  }, [user])

  const fetchNationalData = async () => {
    try {
      // Fetch all villages nationally (no filtering)
      const villageParams = {};
      const gapParams = {};

      const [villagesRes, gapsRes] = await Promise.all([
        villageAPI.getVillages(villageParams),
        gapAPI.getGaps(gapParams)
      ])

      let villageData = villagesRes.data.villages || villagesRes.data
      setVillages(villageData)

      // Calculate national stats
      const totalVillages = villageData.length
      const uniqueStates = [...new Set(villageData.map(v => v.state))].length
      const uniqueDistricts = [...new Set(villageData.map(v => `${v.state}-${v.district}`))].length
      const criticalGaps = villageData.filter(v => 
        v.amenities && (
          v.amenities.water === 0 || 
          v.amenities.electricity < 50 || 
          v.amenities.schools === 0
        )
      ).length

      setStats({
        totalVillages,
        totalStates: uniqueStates,
        totalDistricts: uniqueDistricts,
        criticalGaps,
        completedProjects: Math.floor(totalVillages * 0.4), // Mock data
        avgDevelopmentIndex: calculateAvgDevelopmentIndex(villageData)
      })

      // Prepare gap analysis data
      const gaps = analyzeGaps(villageData)
      setGapData(gaps)

      // Generate problem table data
      const problemData = generateProblemTableData(villageData)
      const sortedData = problemData.sort((a, b) => b.peopleAffected - a.peopleAffected)
      setProblemTableData(sortedData)
      setFilteredProblemData(sortedData)

    } catch (error) {
      console.error('Failed to fetch national data:', error)
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

  const generateProblemTableData = (villages) => {
    const problemData = []

    villages.forEach(village => {
      if (!village.amenities) return

      const amenities = village.amenities
      const problems = []

      if (amenities.water === 0) {
        problems.push({
          problem: "No Water Access",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: village.population,
          scRatio: village.sc_ratio,
          severity: "Critical",
          villageId: village.id
        })
      }

      if (amenities.electricity < 50) {
        problems.push({
          problem: "Poor Electricity Coverage",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: Math.round(village.population * (1 - amenities.electricity / 100)),
          scRatio: village.sc_ratio,
          severity: "Critical",
          villageId: village.id
        })
      } else if (amenities.electricity < 80) {
        problems.push({
          problem: "Inadequate Electricity Coverage",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: Math.round(village.population * (1 - amenities.electricity / 100)),
          scRatio: village.sc_ratio,
          severity: "Moderate",
          villageId: village.id
        })
      }

      if (amenities.schools === 0) {
        problems.push({
          problem: "No Schools Available",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: Math.round(village.population * 0.2),
          scRatio: village.sc_ratio,
          severity: "Critical",
          villageId: village.id
        })
      }

      if (amenities.health_centers === 0) {
        problems.push({
          problem: "No Healthcare Facilities",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: village.population,
          scRatio: village.sc_ratio,
          severity: "Critical",
          villageId: village.id
        })
      }

      if (amenities.toilets < 40) {
        problems.push({
          problem: "Poor Sanitation Coverage",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: Math.round(village.population * (1 - amenities.toilets / 100)),
          scRatio: village.sc_ratio,
          severity: "Critical",
          villageId: village.id
        })
      } else if (amenities.toilets < 70) {
        problems.push({
          problem: "Inadequate Sanitation Coverage",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: Math.round(village.population * (1 - amenities.toilets / 100)),
          scRatio: village.sc_ratio,
          severity: "Moderate",
          villageId: village.id
        })
      }

      if (amenities.internet < 50) {
        problems.push({
          problem: "Poor Internet Connectivity",
          village: village.name,
          district: village.district,
          state: village.state,
          peopleAffected: Math.round(village.population * (1 - amenities.internet / 100)),
          scRatio: village.sc_ratio,
          severity: "Moderate",
          villageId: village.id
        })
      }

      problemData.push(...problems)
    })

    return problemData
  }

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    
    if (filter === 'all') {
      const sorted = [...problemTableData].sort((a, b) => b.peopleAffected - a.peopleAffected)
      setFilteredProblemData(sorted)
    } else if (filter === 'state') {
      const sorted = [...problemTableData].sort((a, b) => {
        if (a.state === b.state) {
          return b.peopleAffected - a.peopleAffected
        }
        return a.state.localeCompare(b.state)
      })
      setFilteredProblemData(sorted)
    } else if (filter === 'problem') {
      const sorted = [...problemTableData].sort((a, b) => {
        if (a.problem === b.problem) {
          return b.peopleAffected - a.peopleAffected
        }
        return a.problem.localeCompare(b.problem)
      })
      setFilteredProblemData(sorted)
    }
  }

  const handleCheckStatus = (problem) => {
    setSelectedProblem(problem)
    setShowModal(true)
    setProjectDetails({
      budget: '',
      description: '',
      timeline: '',
      priority: 'Medium',
      contactPerson: '',
      phoneNumber: '',
      additionalNotes: ''
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProblem(null)
  }

  const handleInputChange = (field, value) => {
    setProjectDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmitProject = async (nextStatus) => {
    try {
      const projectData = {
        village_id: selectedProblem.villageId,
        name: `${selectedProblem.problem} - ${selectedProblem.village}`,
        type: getProblemType(selectedProblem.problem),
        progress_pct: 0,
        status: nextStatus,
        budget: projectDetails.budget,
        description: projectDetails.description,
        timeline: projectDetails.timeline,
        priority: projectDetails.priority,
        contact_person: projectDetails.contactPerson,
        phone_number: projectDetails.phoneNumber,
        additional_notes: projectDetails.additionalNotes,
        submitted_by: 'central'
      }
      
      if (selectedProblem && selectedProblem.projectId) {
        await projectAPI.updateProject(selectedProblem.projectId, projectData)
        alert('Project updated successfully!')
      } else {
        await projectAPI.createProject(projectData)
        alert('Project approved for implementation!')
      }
      handleCloseModal()
    } catch (error) {
      console.error('Failed to submit project:', error)
      alert('Failed to approve project. Please try again.')
    }
  }

  const getProblemType = (problemText) => {
    if (problemText.toLowerCase().includes('water')) return 'water'
    if (problemText.toLowerCase().includes('electricity')) return 'electricity'
    if (problemText.toLowerCase().includes('school')) return 'education'
    if (problemText.toLowerCase().includes('health')) return 'healthcare'
    if (problemText.toLowerCase().includes('sanitation') || problemText.toLowerCase().includes('toilet')) return 'sanitation'
    if (problemText.toLowerCase().includes('internet')) return 'connectivity'
    return 'other'
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

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16']

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Globe className="w-8 h-8 mr-3 text-primary-600" />
            Central Dashboard - National Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Managing rural development initiatives across India
          </p>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Role:</span> Central Government Officer
          </div>
        </div>

        {/* National Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
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
                  {stats.totalVillages?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Districts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDistricts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  States
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalStates}
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
                  {stats.criticalGaps?.toLocaleString()}
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
                  {stats.completedProjects?.toLocaleString()}
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
                  National Dev Index
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
              National Gap Analysis by Category
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
                <Tooltip formatter={(value) => value.toLocaleString()} />
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
                  National Map View
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore states and regions
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
                  National Gap Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nationwide gap detection
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
                  National Reports
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate national reports
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* National Problems & Gaps Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                National Problems & Gaps Overview
              </h3>
              <div className="flex space-x-2">
                {[
                  { label: 'All', value: 'all' },
                  { label: 'By State', value: 'state' },
                  { label: 'By Problem', value: 'problem' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleFilterChange(f.value)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      activeFilter === f.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Village
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    People Affected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProblemData.slice(0, 20).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.problem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.village}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.district}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.state}
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
                      <button
                        onClick={() => handleCheckStatus(item)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Final Approval
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProblemData.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No problems detected nationally
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredProblemData.length > 20 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
              Showing 20 of {filteredProblemData.length} problems
              <Link to="/gaps" className="ml-2 text-primary-600 hover:text-primary-700">
                View all problems →
              </Link>
            </div>
          )}
        </div>

        {/* Final Approval Modal */}
        {showModal && selectedProblem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Final Project Approval
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="px-6 py-4">
                {/* Problem Information */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                      <span className="font-medium text-gray-600 dark:text-gray-400">District:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.district}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">State:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.state}</p>
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
                  </div>
                </div>

                {/* Final Approval Details */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Central Government Final Approval
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Final Budget Allocation (₹)
                      </label>
                      <input
                        type="number"
                        value={projectDetails.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter final budget allocation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Implementation Timeline (Months)
                      </label>
                      <input
                        type="number"
                        value={projectDetails.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Implementation timeline"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Central Coordinator
                      </label>
                      <input
                        type="text"
                        value={projectDetails.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Central project coordinator"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        National Priority Level
                      </label>
                      <select
                        value={projectDetails.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                        <option value="Critical">National Priority</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Central Government Directives
                    </label>
                    <textarea
                      value={projectDetails.additionalNotes}
                      onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Central government directives and implementation guidelines"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitProject('approved')}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Final Approval for Implementation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}