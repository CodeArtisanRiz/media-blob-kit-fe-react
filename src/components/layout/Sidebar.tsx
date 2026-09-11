import React from 'react'
import { FolderKanban, Images, Activity, Users, LogOut, Layers, X, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentView: string
  setCurrentView: (view: string) => void
  isOpenMobile: boolean
  setIsOpenMobile: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  isOpenMobile,
  setIsOpenMobile
}) => {
  const { user, logout } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()

  const mainNav = [
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'media', label: 'Media Gallery', icon: Images },
    { id: 'jobs', label: 'Live Job Monitor', icon: Activity },
  ]

  if (user?.role === 'su') {
    mainNav.push({ id: 'users', label: 'User Management', icon: Users })
  }

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Branding Header */}
        <div className="p-5 border-b flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-foreground">MediaBlobKit</h1>
              <p className="text-xs text-muted-foreground">Media & Image Suite</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grouped Sidebar Navigation */}
        <nav className="p-4 space-y-6">
          <div>
            <p className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
              Workspace & Operations
            </p>
            <div className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon
                const isActive = currentView === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id)
                      setIsOpenMobile(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground uppercase">
              {user?.role}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="h-8 w-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="h-8 w-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card flex-col h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in-0"
        />
      )}

      {/* Mobile Slide-Over Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
