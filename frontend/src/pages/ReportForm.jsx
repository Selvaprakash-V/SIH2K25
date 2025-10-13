import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { villageAPI, reportAPI } from '../services/api'
import { useOffline } from '../store/OfflineContext'
import { 
  Camera, 
  MapPin, 
  Send, 
  X, 
  Check,
  Upload,
  Wifi,
  WifiOff
} from 'lucide-react'

export default function ReportForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const { isOnline, addOfflineReport, syncPendingReports, pendingReports } = useOffline()
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    fetchVillages()
    getCurrentLocation()
  }, [])

  const fetchVillages = async () => {
    try {
  const response = await villageAPI.getVillages()
  setVillages(response.data.villages || response.data)
    } catch (error) {
      console.error('Failed to fetch villages:', error)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.')
      return
    }

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          long: position.coords.longitude
        })
        setLocationLoading(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setLocationLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const onSubmit = async (data) => {
    setLoading(true)

    try {
      const reportData = {
        village_id: data.village_id,
        description: data.description,
        gps_lat: currentLocation?.lat || data.manual_lat || 0,
        gps_long: currentLocation?.long || data.manual_long || 0
      }

      if (selectedImage) {
        reportData.image = selectedImage
      }

      if (isOnline) {
        // Submit directly to server
        await reportAPI.createReport(reportData)
        setSubmitted(true)
      } else {
        // Store offline for later sync
        const result = await addOfflineReport({
          ...reportData,
          gps: {
            lat: reportData.gps_lat,
            long: reportData.gps_long
          }
        })
        
        if (result.success) {
          setSubmitted(true)
        } else {
          throw new Error(result.error)
        }
      }

      // Reset form
      reset()
      setSelectedImage(null)
      setImagePreview(null)
      
    } catch (error) {
      console.error('Failed to submit report:', error)
      alert('Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncReports = async () => {
    if (!isOnline) return
    
    const result = await syncPendingReports()
    if (result.success) {
      alert(`Successfully synced ${result.synced} reports`)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Report Submitted!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isOnline 
                ? 'Your report has been submitted successfully and will be reviewed by the concerned authorities.'
                : 'Your report has been saved offline and will be automatically synced when you\'re back online.'
              }
            </p>
          </div>
          
          <button
            onClick={() => setSubmitted(false)}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Report an Issue
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Help us improve village infrastructure by reporting issues you encounter
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Online</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Reports will be submitted immediately
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-600" />
                  <span className="text-red-600 font-medium">Offline</span>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Reports will be saved locally and synced later
                  </span>
                </>
              )}
            </div>
            
            {pendingReports.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  {pendingReports.length} pending
                </span>
                {isOnline && (
                  <button
                    onClick={handleSyncReports}
                    className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Report Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Village Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Village *
              </label>
              <select
                {...register('village_id', { required: 'Please select a village' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a village</option>
                {villages.map(village => (
                  <option key={village.id} value={village.id}>
                    {village.name} ({village.district}, {village.state})
                  </option>
                ))}
              </select>
              {errors.village_id && (
                <p className="mt-1 text-sm text-red-600">{errors.village_id.message}</p>
              )}
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Description *
              </label>
              <textarea
                {...register('description', { 
                  required: 'Please describe the issue',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' }
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Please describe the issue in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Photo (Optional)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        Click to upload or drag and drop
                      </span>
                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              
              {currentLocation ? (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 dark:text-green-400 text-sm">
                    Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.long.toFixed(6)}
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="flex items-center px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                    </button>
                  </div>
                  
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    or enter manually
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register('manual_lat')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., 28.6139"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        {...register('manual_long')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., 77.2090"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Submitting...' : isOnline ? 'Submit Report' : 'Save Offline'}
              </button>
            </div>
          </form>
        </div>

        {/* Offline Reports List */}
        {pendingReports.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pending Reports ({pendingReports.length})
              </h3>
              
              <div className="space-y-3">
                {pendingReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {report.description?.substring(0, 50)}...
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center text-yellow-600">
                      <Upload className="h-4 w-4 mr-1" />
                      <span className="text-xs">Pending</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {isOnline && (
                <button
                  onClick={handleSyncReports}
                  className="mt-4 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Sync All Reports
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}