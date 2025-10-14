import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { projectAPI, villageAPI } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Users,
  IndianRupee,
  ArrowRight,
  Edit,
  X,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'

export default function ProjectTracker() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const [newProject, setNewProject] = useState({
    village_id: '',
    name: '',
    type: '',
    description: '',
    estimated_cost: 0,
    estimated_duration_months: 6,
    priority: 'medium',
    progress_pct: 0
  })

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      // Build query parameters based on user role
      let projectParams = {}
      let villageParams = {}
      
      if (user?.role === 'village' && user?.village) {
        // Village functionaries can only see projects for their village
        villageParams.name = user.village
        villageParams.state = user.state
        villageParams.district = user.district
        projectParams.village_name = user.village
      } else if (user?.role === 'district') {
        projectParams.state = user.state
        projectParams.district = user.district
        villageParams.state = user.state
        villageParams.district = user.district
      } else if (user?.role === 'state') {
        projectParams.state = user.state
        villageParams.state = user.state
      }
      // Central users see all data (no filtering)

      const [projectsRes, villagesRes] = await Promise.all([
        projectAPI.getProjects(projectParams),
        villageAPI.getVillages(villageParams)
      ])
      
      // Additional filtering on frontend for village functionaries
      let projectData = projectsRes.data.projects || projectsRes.data
      let villageData = villagesRes.data.villages || villagesRes.data
      
      if (user?.role === 'village' && user?.village) {
        // Find the village ID for the user's village
        const userVillage = villageData.find(v => v.name === user.village && v.district === user.district && v.state === user.state)
        if (userVillage) {
          projectData = projectData.filter(p => p.village_id === userVillage.id || p.village_id === userVillage._id)
        } else {
          projectData = []
        }
      }
      
      setProjects(projectData)
      setVillages(villageData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    
    try {
      await projectAPI.createProject(newProject)
      setShowCreateForm(false)
      setNewProject({
        village_id: '',
        name: '',
        type: '',
        description: '',
        estimated_cost: 0,
        estimated_duration_months: 6,
        priority: 'medium',
        progress_pct: 0
      })
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
      case 'pending_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'pending_state':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <ThumbsUp className="h-4 w-4" />
      case 'pending_admin':
        return <FileText className="h-4 w-4" />
      case 'pending_state':
        return <Clock className="h-4 w-4" />
      case 'planned':
        return <AlertCircle className="h-4 w-4" />
      case 'rejected':
        return <ThumbsDown className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_state':
        return t('projectsPage.statusPendingState')
      case 'pending_admin':
        return t('projectsPage.statusPendingAdmin')
      default:
        return t(`projectsPage.${status}`, status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '))
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      education: '🎓',
      healthcare: '❤️',
      water: '💧',
      electricity: '⚡',
      sanitation: '🚿',
      roads: '🛣️',
      connectivity: '📶'
    }
    return icons[type] || '📋'
  }

  const getFilteredProjects = () => {
    return projects.filter(project => {
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      if (statusFilter && project.status !== statusFilter) {
        return false
      }
      if (typeFilter && project.type !== typeFilter) {
        return false
      }
      return true
    })
  }

  const getVillageName = (villageId) => {
    const village = villages.find(v => v.id === villageId)
    return village ? village.name : 'Unknown Village'
  }

  const getProjectStats = () => {
    const total = projects.length
    const completed = projects.filter(p => p.status === 'completed').length
    const inProgress = projects.filter(p => p.status === 'in_progress').length
    const approved = projects.filter(p => p.status === 'approved').length
    const pendingApproval = projects.filter(p => ['pending_state', 'pending_admin'].includes(p.status)).length
    
    return { total, completed, inProgress, approved, pendingApproval }
  }

  const handleApproveProject = async (projectId, nextStatus) => {
    try {
      await projectAPI.updateProject(projectId, { 
        status: nextStatus,
        approved_by: user?.name || user?.role 
      })
      fetchData() // Refresh the list
      alert(`Project ${nextStatus === 'approved' ? 'approved' : 'forwarded'} successfully!`)
    } catch (error) {
      console.error('Failed to update project:', error)
      alert('Failed to update project status')
    }
  }

  const handleRejectProject = async (projectId, reason) => {
    try {
      await projectAPI.updateProject(projectId, { 
        status: 'rejected',
        rejection_reason: reason || 'Not specified'
      })
      fetchData() // Refresh the list
      alert('Project rejected successfully!')
    } catch (error) {
      console.error('Failed to reject project:', error)
      alert('Failed to reject project')
    }
  }

  const stats = getProjectStats()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filteredProjects = getFilteredProjects()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('projectsPage.title')}
              {user?.role === 'district' && ` - ${user.district}`}
              {user?.role === 'state' && ` - ${user.state} State`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {user?.role === 'district' 
                ? t('projectsPage.subtitleDistrict')
                : user?.role === 'state'
                ? t('projectsPage.subtitleState')
                : t('projectsPage.subtitleAdmin')
              }
            </p>
            <div className="mt-2 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Users className="w-3 h-3 mr-1" />
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Officer
              </span>
            </div>
          </div>
          
          {user?.role === 'district' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('projectsPage.submitNewProject')}
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('projectsPage.statsTotal')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
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
                  {t('projectsPage.statsCompleted')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('projectsPage.statsInProgress')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.inProgress}
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
                  {t('projectsPage.statsApproved')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.approved}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('projectsPage.statsPending')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pendingApproval}
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
                {t('projectsPage.filtersSearch')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={t('projectsPage.placeholderSearch')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('projectsPage.filtersStatus')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('projectsPage.allStatuses')}</option>
                <option value="planned">{t('projectsPage.planned')}</option>
                <option value="in_progress">{t('projectsPage.in_progress')}</option>
                <option value="completed">{t('projectsPage.completed')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('projectsPage.filtersType')}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('projectsPage.allTypes')}</option>
                <option value="education">{t('projectsPage.education')}</option>
                <option value="healthcare">{t('projectsPage.healthcare')}</option>
                <option value="water">{t('projectsPage.water')}</option>
                <option value="electricity">{t('projectsPage.electricity')}</option>
                <option value="sanitation">{t('projectsPage.sanitation')}</option>
                <option value="roads">{t('projectsPage.roads')}</option>
                <option value="connectivity">{t('projectsPage.connectivity')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('projectsPage.emptyTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter || typeFilter 
                  ? t('projectsPage.emptyHintFilters')
                  : t('projectsPage.emptyHintCreate')}
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTypeIcon(project.type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getVillageName(project.village_id)}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      <span className="ml-1">{getStatusText(project.status)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('projectsPage.progress')}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.progress_pct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress_pct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <span className="w-16 font-medium">Type:</span>
                      <span className="capitalize">{project.type}</span>
                    </div>
                    {project.created_at && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{t('projectsPage.created')}: {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* SCA Approval Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('common.status')}: {getStatusText(project.status)}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* State Officer Actions */}
                      {user?.role === 'state' && project.status === 'pending_state' && (
                        <>
                          <button 
                            onClick={() => handleApproveProject(project.id, 'pending_admin')}
                            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('projectsPage.forwardToAdmin')}
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Reason for rejection:')
                              if (reason) handleRejectProject(project.id, reason)
                            }}
                            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t('projectsPage.btnReject')}
                          </button>
                        </>
                      )}
                      
                      {/* Admin Actions */}
                      {user?.role === 'admin' && project.status === 'pending_admin' && (
                        <>
                          <button 
                            onClick={() => handleApproveProject(project.id, 'approved')}
                            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('projectsPage.finalApproval')}
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Reason for rejection:')
                              if (reason) handleRejectProject(project.id, reason)
                            }}
                            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {t('projectsPage.btnReject')}
                          </button>
                        </>
                      )}
                      
                      {/* View Details for All */}
                      <button className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        {t('projectsPage.btnViewDetails')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Project Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('projectsPage.createNewProject')}
              </h2>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.state')} / {t('common.district')} / {t('common.selectVillage')}
                  </label>
                  <select
                    value={newProject.village_id}
                    onChange={(e) => setNewProject(prev => ({ ...prev, village_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('projectsPage.selectVillage')}</option>
                    {villages.map(village => (
                      <option key={village.id} value={village.id}>
                        {village.name} ({village.district}, {village.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('projectsPage.projectName')}
                  </label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder={t('projectsPage.projectName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('projectsPage.filtersType')}
                  </label>
                  <select
                    value={newProject.type}
                    onChange={(e) => setNewProject(prev => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('projectsPage.selectType')}</option>
                    <option value="education">{t('projectsPage.education')}</option>
                    <option value="healthcare">{t('projectsPage.healthcare')}</option>
                    <option value="water">{t('projectsPage.water')}</option>
                    <option value="electricity">{t('projectsPage.electricity')}</option>
                    <option value="sanitation">{t('projectsPage.sanitation')}</option>
                    <option value="roads">{t('projectsPage.roads')}</option>
                    <option value="connectivity">{t('projectsPage.connectivity')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="Brief description of the project..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Cost (₹)
                    </label>
                    <input
                      type="number"
                      value={newProject.estimated_cost}
                      onChange={(e) => setNewProject(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (months)
                    </label>
                    <input
                      type="number"
                      value={newProject.estimated_duration_months}
                      onChange={(e) => setNewProject(prev => ({ ...prev, estimated_duration_months: parseInt(e.target.value) || 6 }))}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      placeholder="6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {t('projectsPage.createProject')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('projectsPage.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}