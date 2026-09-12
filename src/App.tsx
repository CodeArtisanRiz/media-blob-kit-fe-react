import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Login } from '@/pages/Login'
import { Projects } from '@/pages/Projects'
import { MediaManager } from '@/pages/MediaManager'
import { JobMonitor } from '@/pages/JobMonitor'
import { UsersPage } from '@/pages/Users'

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('mbk_sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('mbk_sidebar_collapsed', String(isCollapsed))
  }, [isCollapsed])

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row antialiased">
      {/* Dynamic Collapsible Responsive Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Workspace Column with Top Navigation Header */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isOpenMobile={isOpenMobile}
          setIsOpenMobile={setIsOpenMobile}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>Authenticating workspace...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/projects" replace />
  }

  return <AppLayout>{children}</AppLayout>
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>Loading workspace...</span>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/projects" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Protected Workspace Routes with unique URL paths */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media"
                element={
                  <ProtectedRoute>
                    <MediaManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <JobMonitor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['su', 'admin']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />

              {/* Default & Fallback Redirections */}
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
