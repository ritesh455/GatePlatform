"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { apiService } from "../services/api"
import { useAuth } from "./AuthContext"

// --- FIX: Minimal Type Definition for useAuth to resolve destructuring error ---
// This assumes 'user' and 'loading' exist in the AuthContext return type.
interface AuthContextValueType {
  user: { role: string } | null; // Assumes user is an object with 'role' or null
  loading: boolean;
  // ... other auth properties if needed
}
// Note: You must ensure the actual 'useAuth' hook in './AuthContext' returns
// an object that matches this structure. If the error persists, you need to
// update the original AuthContext.tsx file.

// --- INTERFACES FOR ADMIN DATA ---

// Based on the PostgreSQL 'student' table
export interface Student {
  id: number
  username: string
  email: string
  branch: string | null
  gender: string | null
  city: string | null
  state: string | null
  created_at: string
}

// Assuming the 'admins' table IDs are also BIGSERIAL
export interface Admin {
  id: number
  username: string
  email: string
  role: "admin" | string // Should be 'admin' or 'superadmin', etc.
  request_status: "pending" | "accepted" | "rejected" | "blocked"
  created_at: string
}

export interface AdminDataContextType {
  admins: Admin[]
  students: Student[]
  loading: boolean
  error: string | null
  /** Fetches all admin and student data for the dashboard. */
  fetchDashboardData: () => Promise<void>
  /** Updates the status of a specific sub-admin. Returns true on success. */
  updateAdminStatus: (id: number | string, newStatus: Admin["request_status"]) => Promise<boolean>
  /** Deletes a specific student record. Returns true on success. */
  deleteStudent: (id: number | string) => Promise<boolean>
}

// FIX 1: Changed DataContextType to AdminDataContextType
const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined)

export const useAdminData = () => {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error("useAdminData must be used within an AdminDataProvider")
  }
  return context
}

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Assuming useAuth provides a way to check if the user is authenticated and an admin
  // FIX 2: Used 'as unknown as' to resolve the type conflict warning/error.
  const { user, loading: authLoading } = useAuth() as unknown as AuthContextValueType

  const fetchDashboardData = useCallback(async () => {
    setError(null)
    setLoading(true)

    // Optional: Add a check here if the user's role is not 'admin'
    // if (user?.role !== 'admin') { return; } 

    try {
      const response = await apiService.getAdminDashboardData()

      if (response.success && response.data) {
        setAdmins(response.data.admins || [])
        setStudents(response.data.students || [])
      } else {
        const message = response.message || "Failed to load admin dashboard data"
        setError(message)
        console.error(message)
      }
    } catch (err) {
      setError("Network or server error fetching dashboard data.")
      console.error("Failed to fetch dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial data load when user state is ready
  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData()
    } else if (!authLoading && !user) {
      // If auth is ready but no user, stop loading state
      setLoading(false)
    }
  }, [user, authLoading, fetchDashboardData])


  const updateAdminStatus = async (id: number | string, newStatus: Admin["request_status"]) => {
    try {
      const response = await apiService.updateAdminStatus(id, newStatus)

      if (response.success && response.data) {
        const updatedAdmin = response.data.admin
        // Update local state with the newly updated admin object
        setAdmins((prev) =>
          prev.map((a) => (a.id === updatedAdmin.id ? updatedAdmin : a))
        )
        return true
      } else {
        setError(response.message || "Failed to update admin status.")
        return false
      }
    } catch (err) {
      setError("Network error while updating admin status.")
      console.error("Failed to update admin status:", err)
      return false
    }
  }

  const deleteStudent = async (id: number | string) => {
    try {
      const response = await apiService.deleteStudent(id)

      if (response.success) {
        // Remove the student from local state
        setStudents((prev) => prev.filter((s) => s.id !== Number(id)))
        return true
      } else {
        setError(response.message || "Failed to delete student.")
        return false
      }
    } catch (err) {
      setError("Network error while deleting student.")
      console.error("Failed to delete student:", err)
      return false
    }
  }

  return (
    <AdminDataContext.Provider
      value={{
        admins,
        students,
        loading,
        error,
        fetchDashboardData,
        updateAdminStatus,
        deleteStudent,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  )
}