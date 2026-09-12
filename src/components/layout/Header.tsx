import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import {
  PanelLeftClose,
  PanelLeft,
  Menu,
  Sun,
  Moon,
  LogOut,
  Layers,
} from 'lucide-react'

interface HeaderProps {
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  isOpenMobile: boolean
  setIsOpenMobile: (open: boolean) => void
}

export const Header: React.FC<HeaderProps> = ({
  isCollapsed,
  setIsCollapsed,
  setIsOpenMobile,
}) => {
  const { user, logout } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const location = useLocation()

  const getPageMeta = (pathname: string) => {
    switch (pathname) {
      case '/projects':
        return { title: 'Projects', subtitle: 'Storage Buckets & Variant Rules' }
      case '/media':
        return { title: 'Media Gallery', subtitle: 'Asset Storage & CDN Previews' }
      case '/jobs':
        return { title: 'Live Job Monitor', subtitle: 'Queue Telemetry & Events' }
      case '/users':
        return { title: 'User Management', subtitle: 'Access Accounts & RBAC' }
      default:
        return { title: 'Workspace', subtitle: 'MediaBlobKit Storage Suite' }
    }
  }

  const pageMeta = getPageMeta(location.pathname)

  const handleLogout = () => {
    logout()
    toast({
      title: 'Signed Out',
      description: 'You have been safely signed out of MediaBlobKit.',
      variant: 'default',
    })
  }

  return (
    <header className="h-14 border-b border-border/80 bg-card/60 backdrop-blur-xl sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4 select-none">
      {/* Left: Sidebar Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setIsOpenMobile(true)}
          className="md:hidden p-1.5 rounded-md border border-border/70 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
          title="Open Navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Desktop Sidebar Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="hidden md:flex p-1.5 rounded-md border border-border/70 text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/projects"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Layers className="h-3 w-3" />
            </div>
            <span className="hidden sm:inline">MediaBlobKit</span>
          </Link>
          <span className="text-muted-foreground/40 font-mono">/</span>
          <span className="font-semibold text-foreground tracking-tight">{pageMeta.title}</span>
        </div>
      </div>

      {/* Right: Engine Status, Theme Toggle, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/70 border border-border/60 text-[10px] font-mono text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>S3 Engine v0.1</span>
        </div>

        {/* Theme Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="h-8 w-8 rounded-md border border-border/70 bg-background/50 hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-all flex items-center justify-center shadow-sm"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5 text-slate-700" />}
        </button>

        {/* User Profile Pill & Logout */}
        <div className="flex items-center gap-2 pl-1 border-l border-border/60">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-foreground leading-tight">{user?.username}</span>
            <span className="text-[9px] font-mono uppercase text-muted-foreground leading-none">
              {user?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="h-8 w-8 rounded-md border border-border/70 bg-background/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center shadow-sm"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
