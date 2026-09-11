import React, { useState, useEffect } from 'react'
import { api } from '@/api/client'
import type { User, PaginatedResponse, Role } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, ShieldCheck, UserCheck } from 'lucide-react'

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<Role>('user')
  const [createError, setCreateError] = useState('')

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await api.get<PaginatedResponse<User>>('/users')
      setUsers(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    try {
      await api.post('/users', {
        username: newUsername,
        password: newPassword,
        role: newRole,
      })
      setIsCreateOpen(false)
      setNewUsername('')
      setNewPassword('')
      fetchUsers()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { error?: string } } }).response
        setCreateError(resp?.data?.error || 'Failed to create user')
      } else {
        setCreateError('Failed to create user')
      }
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete user account '${username}'?`)) return
    try {
      await api.delete(`/users/${userId}`)
      fetchUsers()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { error?: string } } }).response
        alert(resp?.data?.error || 'Failed to delete user')
      } else {
        alert('Failed to delete user')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">User Management</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
              {users.length} accounts
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Superuser control panel for provisioning system access accounts and managing RBAC permissions
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 self-start sm:self-auto" size="sm">
          <Plus className="h-3.5 w-3.5" />
          <span>Provision User</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Loading user records...
        </div>
      ) : (
        <div className="border border-border/80 rounded-lg bg-card/60 overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/80 border-b border-border/70 text-[10px] font-medium uppercase text-muted-foreground tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-4 font-sans">Username</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3 font-sans">Created Date</th>
                  <th className="py-2.5 px-4 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.03] transition-colors group font-sans">
                    <td className="py-2.5 px-4 font-medium text-foreground flex items-center gap-2">
                      {u.role === 'su' ? (
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span>{u.username}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <Badge variant={u.role === 'su' ? 'default' : u.role === 'admin' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-mono">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px] font-mono">{u.id}</td>
                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">{formatDate(u.created_at)}</td>
                    <td className="py-2.5 px-4 text-right">
                      {u.role !== 'su' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="h-6 w-6 rounded inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Provision New Account" className="max-w-md">
        <form onSubmit={handleCreateUser} className="space-y-3.5">
          {createError && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {createError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Username</label>
            <Input
              type="text"
              placeholder="e.g. backend_service"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Password</label>
            <Input
              type="password"
              placeholder="Enter secure password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="w-full h-8 rounded-md border border-border/80 bg-background/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="user" className="bg-card text-foreground">User (Standard Access)</option>
              <option value="admin" className="bg-card text-foreground">Admin (Project Owner)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">Create Account</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
