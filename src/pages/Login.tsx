import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Layers, Lock, User, Eye, EyeOff, Sun, Moon } from 'lucide-react'

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
      setError('Invalid credentials. Please verify username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Linear subtle starlight background glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top-right theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className="h-8 w-8 rounded-md border border-border/80 bg-card/80 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors flex items-center justify-center shadow-sm"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-700" />}
        </button>
      </div>

      <Card className="w-full max-w-sm border-border/80 bg-card/85 backdrop-blur-xl shadow-linear-card relative z-10">
        <CardHeader className="space-y-2.5 text-center pb-4">
          <div className="mx-auto h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-linear-glow border border-white/[0.15]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground">MediaBlobKit</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Sign in to manage storage buckets & image variants
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-3.5 pt-0">
            {error && (
              <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-8 pr-8 text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" className="w-full h-8 text-xs font-medium" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
