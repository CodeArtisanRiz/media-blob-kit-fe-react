import React, { useState } from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Login } from '@/pages/Login'
import { Projects } from '@/pages/Projects'
import { MediaManager } from '@/pages/MediaManager'
import { JobMonitor } from '@/pages/JobMonitor'
import { UsersPage } from '@/pages/Users'
import { Menu, Layers } from 'lucide-react'

const DashboardContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [currentView, setCurrentView] = useState('projects')
  const [isOpenMobile, setIsOpenMobile] = useState(false)

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
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header with Logo & Right Hamburger Button */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-card sticky top-0 z-30 shadow-sm">
        <button
          onClick={() => setCurrentView('projects')}
          className="flex items-center gap-2 text-left focus:outline-none"
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground leading-none block">T3G MediaBlobKit</span>
            <span className="text-[10px] text-muted-foreground block">Command Center</span>
          </div>
        </button>

        {/* Right Hamburger Toggle */}
        <button
          onClick={() => setIsOpenMobile(true)}
          className="p-2 rounded-lg border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Responsive Sidebar Component */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
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
