import React from 'react'
import { FolderKanban, Images, Activity, Users, LogOut, Layers } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentView: string
  setCurrentView: (view: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth()

  const mainNav = [
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'media', label: 'Media Gallery', icon: Images },
    { id: 'jobs', label: 'Live Job Monitor', icon: Activity },
  ]

  if (user?.role === 'su') {
    mainNav.push({ id: 'users', label: 'User Management', icon: Users })
  }

  return (
    <aside className="w-64 border-r bg-card flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* T3G Branding Header */}
        <div className="p-5 border-b flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-foreground">T3G MediaBlobKit</h1>
            <p className="text-xs text-muted-foreground">Admin Command Center</p>
          </div>
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
                    onClick={() => setCurrentView(item.id)}
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
          <button
            onClick={logout}
            title="Logout"
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
