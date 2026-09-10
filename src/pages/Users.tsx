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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Superuser control panel for provisioning Admin and User access accounts
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Provision User</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading users...</div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 pl-4">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-4 font-semibold text-foreground flex items-center gap-2">
                      {u.role === 'su' ? (
                        <ShieldCheck className="h-4 w-4 text-amber-500" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-primary" />
                      )}
                      <span>{u.username}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant={u.role === 'su' ? 'default' : u.role === 'admin' ? 'secondary' : 'outline'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground text-[11px]">{u.id}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="p-3 pr-4 text-right">
                      {u.role !== 'su' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Provision New User Account">
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {createError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Username</label>
            <Input
              type="text"
              placeholder="e.g. john_developer"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Password</label>
            <Input
              type="password"
              placeholder="Enter secure password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="w-full h-9 rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="user">User (Standard Access)</option>
              <option value="admin">Admin (Project Owner)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
