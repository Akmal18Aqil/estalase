'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Tenant, getCurrentUser, getUserTenant, supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  tenant: Tenant | null
  loading: boolean
  isOwner: boolean
  isStaff: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      const userData = await getCurrentUser()
      setUser(userData)

      if (userData) {
        const tenantData = await getUserTenant()
        setTenant(tenantData)
      } else {
        setTenant(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      setTenant(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setTenant(null)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    refreshUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setTenant(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Derived state
  const isOwner = user?.role === 'owner'
  const isStaff = user?.role === 'staff'

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      loading,
      isOwner,
      isStaff,
      signOut,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}