import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Layers, Lock, User, Eye, EyeOff, Sun, Moon, Sparkles, Shield, Zap } from 'lucide-react'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch {
      setError('Invalid credentials. Please verify your username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Linear Starlight & Subtle Ambient Glow Background */}
      <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-b from-[#5e6ad2]/20 via-[#7170ff]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="h-8 w-8 rounded-md border border-white/[0.08] bg-white/[0.03] backdrop-blur-md text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.08] transition-all flex items-center justify-center shadow-sm"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-300" />}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Release / Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] font-medium text-[#d0d6e0] backdrop-blur-md mb-6 shadow-sm">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Media Storage & Transformation Engine</span>
          <span className="text-[#62666d]">|</span>
          <span className="text-[10px] font-mono text-[#8a8f98]">v0.1.0</span>
        </div>

        {/* Linear Precision Login Card */}
        <Card className="w-full border-white/[0.08] bg-[#0f1011]/85 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(94,106,210,0.15),0_0_0_1px_rgba(255,255,255,0.05)] rounded-xl overflow-hidden">
          <CardHeader className="space-y-3 text-center pb-5 pt-7 px-7">
            <div className="mx-auto h-11 w-11 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center text-white font-bold shadow-[0_0_24px_rgba(94,106,210,0.45)] border border-white/[0.2]">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold tracking-[-0.03em] text-[#f7f8f8]">
                MediaBlobKit
              </CardTitle>
              <CardDescription className="text-xs text-[#8a8f98] mt-1.5 leading-relaxed">
                Sign in to manage storage buckets, access keys, and image transformation presets.
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 px-7 pt-1 pb-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase text-[#8a8f98] tracking-wider block">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#62666d]" />
                  <Input
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 bg-white/[0.03] border-white/[0.08] text-xs text-[#f7f8f8] placeholder:text-[#62666d] focus-visible:border-[#5e6ad2] focus-visible:ring-[#5e6ad2]/40 h-9 font-mono"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase text-[#8a8f98] tracking-wider block">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#62666d]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 bg-white/[0.03] border-white/[0.08] text-xs text-[#f7f8f8] placeholder:text-[#62666d] focus-visible:border-[#5e6ad2] focus-visible:ring-[#5e6ad2]/40 h-9"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#62666d] hover:text-[#d0d6e0] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-7 pt-2 pb-7">
              <Button
                type="submit"
                className="w-full h-9 text-xs font-medium bg-[#5e6ad2] hover:bg-[#7170ff] text-white shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] border border-[#7170ff]/30 transition-all active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Feature Highlights beneath Login */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center w-full px-2">
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#7170ff]">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-medium text-[#d0d6e0]">Instant Transforms</span>
            <span className="text-[10px] text-[#62666d]">WebP, AVIF, resizing</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#7170ff]">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-medium text-[#d0d6e0]">S3 Storage</span>
            <span className="text-[10px] text-[#62666d]">Isolated project keys</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#7170ff]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-medium text-[#d0d6e0]">Edge Pipeline</span>
            <span className="text-[10px] text-[#62666d]">Async variant queues</span>
          </div>
        </div>
      </div>
    </div>
  )
}
