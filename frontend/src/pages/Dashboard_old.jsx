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

import VillageDashboard from './VillageDashboard';
import DistrictDashboard from './DistrictDashboard';

export default function Dashboard({ role: propRole }) {
  const { user } = useAuth ? useAuth() : { user: null };
  const role = propRole || (user && user.role) || 'district';

  if (role === 'village') {
    return <VillageDashboard />;
  }
  if (role === 'district') {
    return <DistrictDashboard />;
  }
  // You can add StateDashboard, AdminDashboard, etc. as needed
  return <div>Unsupported role</div>;
}

    try {
      let villageParams = {}
      let gapParams = {}

      if (user?.role === 'village') {
        // Only fetch the selected village
        villageParams = { name: user.village };
      } else if (user?.role === 'district') {
        // Fetch all villages in the district
        villageParams = { state: user.state, district: user.district };
        gapParams = { state: user.state, district: user.district };
      } else if (user?.role === 'state') {
        villageParams.state = user.state
        gapParams.state = user.state
      }

      const [villagesRes, gapsRes] = await Promise.all([
        villageAPI.getVillages(villageParams),
        gapAPI.getGaps(gapParams)
      ])

      let villageData = villagesRes.data.villages || villagesRes.data
      // If village functionary, filter to only their village (in case API returns more)
      if (user?.role === 'village' && user.village) {
        villageData = villageData.filter(v => v.name === user.village)
      }
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

      // Generate problem table data
      const problemData = generateProblemTableData(villageData)
      // Sort by people affected in descending order by default
      const sortedData = problemData.sort((a, b) => b.peopleAffected - a.peopleAffected)
      setProblemTableData(sortedData)
      setFilteredProblemData(sortedData)

    } catch (error) {
      // ...existing code...
    }
  }
// ...existing code...

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
          state: village.state,
          peopleAffected: Math.round(village.population * 0.2), // Assume 20% school-age children
          scRatio: village.sc_ratio,
          severity: "Critical",
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
      // Sort by people affected descending (default)
      const sorted = [...problemTableData].sort((a, b) => b.peopleAffected - a.peopleAffected)
      setFilteredProblemData(sorted)
    } else if (filter === 'village') {
      // Sort by village name, but within same village, sort by people affected descending
      const sorted = [...problemTableData].sort((a, b) => {
        if (a.village === b.village) {
          return b.peopleAffected - a.peopleAffected
        }
        return a.village.localeCompare(b.village)
      })
      setFilteredProblemData(sorted)
    } else if (filter === 'problem') {
      // Sort by problem type, but within same problem, sort by people affected descending
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
    // Reset form
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
        submitted_by: role
      }
      if (selectedProblem && selectedProblem.projectId) {
        await projectAPI.updateProject(selectedProblem.projectId, projectData)
        alert('Project updated successfully!')
      } else {
        await projectAPI.createProject(projectData)
        alert('Project details submitted successfully!')
      }
      handleCloseModal()
    } catch (error) {
      console.error('Failed to submit project:', error)
      alert('Failed to submit project details. Please try again.')
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
            {t('dashboardPage.title')}
            {user?.role === 'district' && ` - ${user.district}, ${user.state}`}
            {user?.role === 'state' && ` - ${user.state} State`}
            {user?.role === 'village' && ` - ${user.village}`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {user?.role === 'district' 
              ? t('dashboardPage.subtitleDistrict', { district: user.district })
              : user?.role === 'state'
              ? t('dashboardPage.subtitleState', { state: user.state })
              : user?.role === 'village'
              ? `You are viewing data for your village: ${user.village}`
              : t('dashboardPage.subtitleAdmin')
            }
          </p>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            <span className="font-medium">Role:</span> {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Officer
          </div>
        </div>

        {/* Village Functionary Upload Section */}
        {user?.role === 'village' && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Upload Village Data (Excel/CSV)</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">Upload your village's data in Excel or CSV format. This will be stored in the database.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fileInput = e.target.elements.villageFile;
                if (!fileInput.files.length) return alert('Please select a file.');
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                  await fetch('/api/upload_village_data', {
                    method: 'POST',
                    body: formData
                  });
                  alert('File uploaded successfully!');
                } catch (err) {
                  alert('Upload failed.');
                }
              }}
            >
              <input type="file" name="villageFile" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="mb-2" />
              <button type="submit" className="ml-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Upload</button>
            </form>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('dashboardPage.totalVillages')}
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
                  {t('dashboardPage.criticalGaps')}
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
                  {t('dashboardPage.projectsDone')}
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
                  {t('dashboardPage.avgDevIndex')}
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
              {t('dashboardPage.gapAnalysisByCategory')}
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
              {t('dashboardPage.villagesByState')}
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
                  {t('dashboardPage.viewVillageMap')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboardPage.exploreVillages')}
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
                  {t('dashboardPage.gapDetection')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboardPage.identifyGaps')}
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
                  {t('dashboardPage.reportIssue')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboardPage.submitFeedback')}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Villages Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('dashboardPage.problemsAndGaps')}
              </h3>
              <div className="flex space-x-2">
                {[
                  { label: t('dashboardPage.filterAll'), value: 'all' },
                  { label: t('dashboardPage.filterVillage'), value: 'village' },
                  { label: t('dashboardPage.filterProblem'), value: 'problem' },
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
                    {t('dashboardPage.colProblem')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('dashboardPage.colVillage')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('dashboardPage.colState')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('dashboardPage.colPeopleAffected')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('dashboardPage.colSCRatio')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('dashboardPage.colSeverity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProblemData.slice(0, 10).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.problem}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.village}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.peopleAffected?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.scRatio}%
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
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {t('dashboardPage.btnCheck')}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProblemData.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t('dashboardPage.noProblems')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredProblemData.length > 10 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
              {t('dashboardPage.showingCount', { count: 10, total: filteredProblemData.length })}
              <Link to="/gaps" className="ml-2 text-primary-600 hover:text-primary-700">
                View all problems →
              </Link>
            </div>
          )}
        </div>

        {/* Problem Details Modal */}
        {showModal && selectedProblem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('dashboardPage.problemInfo')}
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
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('dashboardPage.problemInfo')}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{t('dashboardPage.problem')}:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.problem}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{t('dashboardPage.colVillage')}:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.village}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{t('dashboardPage.colState')}:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.state}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{t('dashboardPage.peopleAffected')}:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.peopleAffected?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{t('dashboardPage.colSCRatio')}:</span>
                      <p className="text-gray-900 dark:text-white">{selectedProblem.scRatio}%</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{t('dashboardPage.severity')}:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedProblem.severity === 'Critical' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {selectedProblem.severity}
                      </span>
                    </div>
                  </div>
                  {/* Show status if available */}
                  {selectedProblem.status && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="ml-2 text-gray-900 dark:text-white">{selectedProblem.status}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}