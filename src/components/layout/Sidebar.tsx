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
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: null },
    { id: 'media', label: 'Media Gallery', icon: Images, badge: null },
    { id: 'jobs', label: 'Live Job Monitor', icon: Activity, badge: 'Live' },
  ]

  if (user?.role === 'su') {
    mainNav.push({ id: 'users', label: 'User Management', icon: Users, badge: null })
  }

  const navContent = (
    <div className="flex flex-col justify-between h-full bg-card/95 backdrop-blur-md">
      <div>
        {/* Linear-style Branding Header */}
        <div className="p-4 border-b border-border/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-linear-glow border border-white/[0.15]">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-semibold text-sm tracking-tight text-foreground">MediaBlobKit</h1>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">v0.1</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Media & Image Suite</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-white/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-4">
          <div>
            <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/70 tracking-wider uppercase mb-1.5">
              Workspace
            </p>
            <div className="space-y-0.5">
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
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-150 group",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/25 shadow-sm font-semibold"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border/70 bg-background/30 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="truncate pr-2">
            <p className="text-xs font-medium text-foreground truncate">{user?.username}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-secondary/80 text-muted-foreground border border-border/40">
                {user?.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="h-7 w-7 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5 text-slate-700" />}
            </button>
            <button
              onClick={logout}
              title="Logout"
              className="h-7 w-7 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-border/80 bg-card flex-col h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-in fade-in-0 duration-200"
        />
      )}

      {/* Mobile Slide-Over Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-68 bg-card border-r border-border/80 shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  )
}
