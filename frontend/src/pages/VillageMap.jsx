import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { villageAPI } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { Filter, Search, MapPin, Users, AlertTriangle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons based on gap severity
const createCustomIcon = (severity) => {
  const colors = {
    critical: '#EF4444',
    moderate: '#F59E0B', 
    good: '#10B981'
  }
  
  return L.divIcon({
    html: `<div style="background-color: ${colors[severity]}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

function MapController({ villages, selectedState, selectedDistrict }) {
  const map = useMap()
  
  useEffect(() => {
    if (villages.length > 0) {
      const filteredVillages = villages.filter(village => {
        if (selectedState && village.state !== selectedState) return false
        if (selectedDistrict && village.district !== selectedDistrict) return false
        return village.geo_lat && village.geo_long
      })
      
      if (filteredVillages.length > 0) {
        const bounds = L.latLngBounds(
          filteredVillages.map(v => [v.geo_lat, v.geo_long])
        )
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [map, villages, selectedState, selectedDistrict])
  
  return null
}

export default function VillageMap() {
  const { user } = useAuth()
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchVillages()
  }, [user])

  const fetchVillages = async () => {
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

      const response = await villageAPI.getVillages(params)
      setVillages(response.data.villages || response.data)
    } catch (error) {
      console.error('Failed to fetch villages:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGapSeverity = (village) => {
    if (!village.amenities) return 'moderate'
    
    const amenities = village.amenities
    const criticalIssues = [
      amenities.water === 0,
      amenities.electricity < 50,
      amenities.schools === 0,
      amenities.health_centers === 0
    ].filter(Boolean).length

    if (criticalIssues >= 2) return 'critical'
    if (criticalIssues === 1) return 'moderate'
    return 'good'
  }

  const getDevelopmentIndex = (village) => {
    if (!village.amenities) return 50
    
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

  const getUniqueStates = () => {
    return [...new Set(villages.map(v => v.state))].sort()
  }

  const getUniqueDistricts = () => {
    const filteredVillages = selectedState 
      ? villages.filter(v => v.state === selectedState)
      : villages
    return [...new Set(filteredVillages.map(v => v.district))].sort()
  }

  const getFilteredVillages = () => {
    return villages.filter(village => {
      // Filter by state
      if (selectedState && village.state !== selectedState) return false
      
      // Filter by district
      if (selectedDistrict && village.district !== selectedDistrict) return false
      
      // Filter by search term
      if (searchTerm && !village.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      // Only show villages with coordinates
      return village.geo_lat && village.geo_long
    })
  }

  const getMapCenter = () => {
    const filteredVillages = getFilteredVillages()
    if (filteredVillages.length === 0) return [20.5937, 78.9629] // India center
    
    const avgLat = filteredVillages.reduce((sum, v) => sum + v.geo_lat, 0) / filteredVillages.length
    const avgLong = filteredVillages.reduce((sum, v) => sum + v.geo_long, 0) / filteredVillages.length
    
    return [avgLat, avgLong]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const filteredVillages = getFilteredVillages()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Village Map View
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Showing {filteredVillages.length} villages
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search villages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value)
                      setSelectedDistrict('')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All States</option>
                    {getUniqueStates().map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Districts</option>
                    {getUniqueDistricts().map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[calc(100vh-200px)] relative">
        <MapContainer
          center={getMapCenter()}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            villages={filteredVillages}
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
          />
          
          {filteredVillages.map(village => (
            <Marker
              key={village.id}
              position={[village.geo_lat, village.geo_long]}
              icon={createCustomIcon(getGapSeverity(village))}
            >
              <Popup>
                <div className="min-w-[250px]">
                  <h3 className="font-bold text-lg mb-2">{village.name}</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{village.district}, {village.state}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Population: {village.population?.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-gray-500 text-xs">SC Ratio: {village.sc_ratio}%</span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Development Index</span>
                        <span className="font-bold text-primary-600">
                          {getDevelopmentIndex(village)}%
                        </span>
                      </div>
                      
                      {village.amenities && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Water Access:</span>
                            <span className={village.amenities.water ? 'text-green-600' : 'text-red-600'}>
                              {village.amenities.water ? 'Available' : 'Not Available'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Electricity:</span>
                            <span className={village.amenities.electricity >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                              {village.amenities.electricity}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Schools:</span>
                            <span className={village.amenities.schools > 0 ? 'text-green-600' : 'text-red-600'}>
                              {village.amenities.schools}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Health Centers:</span>
                            <span className={village.amenities.health_centers > 0 ? 'text-green-600' : 'text-red-600'}>
                              {village.amenities.health_centers}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-[1000]">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Good Development</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Moderate Gaps</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Critical Gaps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}