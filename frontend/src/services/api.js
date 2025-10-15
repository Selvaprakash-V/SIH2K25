import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.PROD 
    ? 'https://sih2k25.vercel.app/api' 
    : 'http://localhost:8002'
)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
}

export const villageAPI = {
  getVillages: (params) => api.get('/villages', { params }),
  getVillage: (id) => api.get(`/villages/${id}`),
  createVillage: (data) => api.post('/villages', data),
}

export const gapAPI = {
  getGaps: (params) => api.get('/gaps', { params }),
  getRecommendations: (params) => api.get('/recommendations', { params }),
}

export const projectAPI = {
  getProjects: (params) => api.get('/projects', { params }),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
}

export const reportAPI = {
  createReport: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key])
      }
    })
    return api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  syncReports: (reports) => api.post('/sync/reports', reports),
}

export default api