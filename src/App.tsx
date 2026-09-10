import React, { useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Login } from '@/pages/Login'
import { Projects } from '@/pages/Projects'
import { MediaManager } from '@/pages/MediaManager'
import { JobMonitor } from '@/pages/JobMonitor'
import { UsersPage } from '@/pages/Users'

const DashboardContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('projects')

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Loading Command Center...
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="flex-1 p-8 max-w-7xl mx-auto overflow-y-auto">
        {currentView === 'projects' && <Projects />}
        {currentView === 'media' && <MediaManager />}
        {currentView === 'jobs' && <JobMonitor />}
        {currentView === 'users' && user.role === 'su' && <UsersPage />}
      </main>
    </div>
  )
}

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  )
}

export default App
