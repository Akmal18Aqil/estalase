'use client'

import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/auth/AuthForm'
import Dashboard from '@/components/dashboard/Dashboard'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <Dashboard />
      </div>
    </div>
  )
}