import React from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FolderKanban, Images, Activity, Users, LogOut, Layers, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  isOpenMobile: boolean
  setIsOpenMobile: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { user, logout } = useAuth()
  const { toast } = useToast()

  const mainNav = [
    { to: '/projects', label: 'Projects', icon: FolderKanban, badge: null },
    { to: '/media', label: 'Media Gallery', icon: Images, badge: null },
    { to: '/jobs', label: 'Live Job Monitor', icon: Activity, badge: 'Live' },
  ]

  if (user?.role === 'su' || user?.role === 'admin') {
    mainNav.push({ to: '/users', label: 'User Management', icon: Users, badge: null })
  }

  const handleLogout = () => {
    logout()
    toast({
      title: 'Logged Out',
      description: 'You have been signed out of your workspace.',
      variant: 'default',
    })
  }

  const navContent = (
    <div className="flex flex-col justify-between h-full bg-card/95 backdrop-blur-md">
      <div>
        {/* Header with Brand Logo and Collapse Button */}
        <div
          className={cn(
            'h-14 border-b border-border/70 flex items-center transition-all duration-200',
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}
        >
          <Link
            to="/projects"
            onClick={() => setIsOpenMobile(false)}
            className="flex items-center gap-2.5 group"
            title="MediaBlobKit"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center text-white font-bold shadow-linear-glow border border-white/[0.2] transition-transform group-hover:scale-105 shrink-0">
              <Layers className="h-4 w-4" />
            </div>

            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-semibold text-sm tracking-tight text-foreground">MediaBlobKit</h1>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                    v0.1
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">Media & Image Suite</p>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsOpenMobile(false)}
            className="md:hidden text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-white/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-4">
          <div>
            {!isCollapsed && (
              <p className="px-2.5 text-[10px] font-semibold text-muted-foreground/70 tracking-wider uppercase mb-1.5 transition-opacity">
                Workspace
              </p>
            )}
            <div className="space-y-1">
              {mainNav.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpenMobile(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center rounded-md text-xs font-medium transition-all duration-150 group relative',
                        isCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-2',
                        isActive
                          ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm font-semibold'
                          : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={cn('flex items-center gap-2.5', isCollapsed && 'justify-center')}>
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0 transition-colors',
                              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          />
                          {!isCollapsed && <span>{item.label}</span>}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                            {item.badge}
                          </span>
                        )}

                        {/* Collapsed Active Status Dot */}
                        {isCollapsed && isActive && (
                          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="p-2 border-t border-border/70 bg-background/30">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-1">
            <div className="truncate pr-2">
              <p className="text-xs font-medium text-foreground truncate">{user?.username}</p>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-secondary/80 text-muted-foreground border border-border/40 mt-0.5">
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="h-7 w-7 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center p-1">
            <button
              onClick={handleLogout}
              title={`Signed in as ${user?.username} (${user?.role}) - Click to sign out`}
              className="h-8 w-8 rounded-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Dynamic Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border/80 bg-card shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-20',
          isCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpenMobile(false)}
          />
          <aside className="relative flex flex-col w-64 max-w-[80vw] h-full bg-card z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </div>
      )}
    </>
  )
}
