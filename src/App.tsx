import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Login } from '@/pages/Login'
import { Projects } from '@/pages/Projects'
import { MediaManager } from '@/pages/MediaManager'
import { JobMonitor } from '@/pages/JobMonitor'
import { UsersPage } from '@/pages/Users'
import { Menu, Layers } from 'lucide-react'

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false)

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header with Logo & Right Hamburger Button */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border/80 bg-card sticky top-0 z-30 shadow-sm">
        <Link
          to="/projects"
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center text-white font-bold shadow border border-white/[0.15]">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground leading-none block">MediaBlobKit</span>
            <span className="text-[10px] text-muted-foreground block">Media & Image Suite</span>
          </div>
        </Link>

        {/* Right Hamburger Toggle */}
        <button
          onClick={() => setIsOpenMobile(true)}
          className="p-2 rounded-lg border border-border/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Responsive Sidebar Component */}
      <Sidebar
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole,
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

  if (requiredRole && user.role !== requiredRole) {
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
                  <ProtectedRoute requiredRole="su">
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
