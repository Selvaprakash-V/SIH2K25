import React, { createContext, useContext, useState, useEffect } from 'react'
import Dexie from 'dexie'
import { reportAPI } from '../services/api'

// Initialize IndexedDB for offline storage
const db = new Dexie('RuralIQOfflineDB')
db.version(1).stores({
  reports: '++id, village_id, description, gps, image, timestamp, synced'
})

const OfflineContext = createContext()

export function useOffline() {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}

export function OfflineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingReports, setPendingReports] = useState([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingReports()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load pending reports on mount
    loadPendingReports()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadPendingReports = async () => {
    try {
      const reports = await db.reports.where('synced').equals(false).toArray()
      setPendingReports(reports)
    } catch (error) {
      console.error('Failed to load pending reports:', error)
    }
  }

  const addOfflineReport = async (reportData) => {
    try {
      const report = {
        ...reportData,
        timestamp: new Date(),
        synced: false,
        client_id: `offline_${Date.now()}_${Math.random()}`
      }

      await db.reports.add(report)
      await loadPendingReports()
      
      return { success: true, id: report.client_id }
    } catch (error) {
      console.error('Failed to save offline report:', error)
      return { success: false, error: 'Failed to save report offline' }
    }
  }

  const syncPendingReports = async () => {
    if (!isOnline || pendingReports.length === 0) return

    try {
      const reportsToSync = await db.reports.where('synced').equals(false).toArray()
      
      if (reportsToSync.length === 0) return

      // Convert reports to API format
      const formattedReports = reportsToSync.map(report => ({
        village_id: report.village_id,
        description: report.description,
        gps_lat: report.gps.lat,
        gps_long: report.gps.long,
        client_id: report.client_id,
        timestamp: report.timestamp
      }))

      const response = await reportAPI.syncReports(formattedReports)
      
      // Mark synced reports
      const syncedIds = response.data.processed
        .filter(p => p.status === 'success')
        .map(p => p.client_id)

      await db.reports
        .where('client_id')
        .anyOf(syncedIds)
        .modify({ synced: true })

      await loadPendingReports()
      
      return { success: true, synced: syncedIds.length }
    } catch (error) {
      console.error('Failed to sync reports:', error)
      return { success: false, error: 'Sync failed' }
    }
  }

  const value = {
    isOnline,
    pendingReports,
    addOfflineReport,
    syncPendingReports,
    loadPendingReports
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}