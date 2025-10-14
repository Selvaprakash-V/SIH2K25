import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { villageAPI, reportAPI } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { useOffline } from '../store/OfflineContext'
import { 
  Camera, 
  MapPin, 
  Send, 
  X, 
  Check,
  Upload,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Database
} from 'lucide-react'

export default function ReportForm() {
  const { user } = useAuth()
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const { isOnline, addOfflineReport, syncPendingReports, pendingReports } = useOffline()
  const [villages, setVillages] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  
  // Village data upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  useEffect(() => {
    fetchVillages()
    if (user?.role !== 'village') {
      getCurrentLocation()
    }
  }, [user])

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
      alert('Geolocation is not supported by this browser.')
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

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    setUploadLoading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/upload_village_data', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setUploadResult(result)
      setSelectedFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('village-data-file')
      if (fileInput) fileInput.value = ''

    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult({
        error: true,
        message: error.message || 'Upload failed. Please try again.'
      })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ]
      
      if (allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv')) {
        setSelectedFile(file)
        setUploadResult(null)
      } else {
        alert('Please select a valid Excel (.xlsx, .xls) or CSV file')
        e.target.value = ''
      }
    }
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
        await reportAPI.createReport(reportData)
        setSubmitted(true)
      } else {
        // Store offline
        addOfflineReport(reportData)
        setSubmitted(true)
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {user?.role === 'village' ? 'Upload Successful!' : 'Report Submitted!'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.role === 'village' 
                ? 'Your village data has been successfully uploaded to the database.'
                : isOnline 
                  ? 'Your report has been submitted successfully and will be reviewed by the appropriate authorities.'
                  : 'Your report has been saved locally and will be synced when you\'re back online.'
              }
            </p>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {user?.role === 'village' ? 'Upload Another File' : 'Submit Another Report'}
          </button>
        </div>
      </div>
    )
  }

  // Village Functionaries see Upload interface
  if (user?.role === 'village') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Upload Village Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload Excel or CSV files to update village data in the database
            </p>
          </div>

          {/* Village Data Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Village Data Upload
              </h2>
            </div>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Excel or CSV File
                </label>
                <input
                  id="village-data-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100
                    dark:file:bg-primary-900 dark:file:text-primary-300"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: .xlsx, .xls, .csv (Max 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-3">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || uploadLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Village Data
                  </>
                )}
              </button>
            </form>

            {uploadResult && (
              <div className={`mt-4 p-4 rounded-md ${
                uploadResult.error 
                  ? 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
                  : 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700'
              }`}>
                <div className={`text-sm ${
                  uploadResult.error 
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-green-800 dark:text-green-200'
                }`}>
                  {uploadResult.error ? (
                    <p>❌ Upload failed: {uploadResult.message}</p>
                  ) : (
                    <div>
                      <p>✅ {uploadResult.message}</p>
                      {uploadResult.created > 0 && (
                        <p>• Created {uploadResult.created} new village records</p>
                      )}
                      {uploadResult.updated > 0 && (
                        <p>• Updated {uploadResult.updated} existing village records</p>
                      )}
                      <p>• Total rows processed: {uploadResult.total_rows}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // District/State/Central users see Report Issue interface
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
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {pendingReports.length} pending reports
                </span>
                {isOnline && (
                  <button
                    onClick={handleSyncReports}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Report Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Village Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Village *
              </label>
              <select
                {...register('village_id', { required: 'Please select a village' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a village</option>
                {villages.map((village) => (
                  <option key={village.id || village._id} value={village.id || village._id}>
                    {village.name} - {village.district}, {village.state}
                  </option>
                ))}
              </select>
              {errors.village_id && (
                <p className="text-red-600 text-sm mt-1">{errors.village_id.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Description *
              </label>
              <textarea
                {...register('description', { required: 'Please describe the issue' })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Describe the issue in detail..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className="space-y-4">
                {currentLocation ? (
                  <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <div className="flex items-center text-green-800 dark:text-green-200">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span className="text-sm">
                        Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.long.toFixed(6)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {locationLoading ? 'Getting location...' : 'Get Current Location'}
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Latitude (manual)
                    </label>
                    <input
                      {...register('manual_lat')}
                      type="number"
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Longitude (manual)
                    </label>
                    <input
                      {...register('manual_long')}
                      type="number"
                      step="any"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Photo (Optional)
              </label>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> a photo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </button>
          </form>

          {pendingReports.length > 0 && !isOnline && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                You have {pendingReports.length} pending reports that will be synced when you're back online.
              </p>
              {isOnline && (
                <button
                  onClick={handleSyncReports}
                  className="mt-4 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Sync All Reports
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}