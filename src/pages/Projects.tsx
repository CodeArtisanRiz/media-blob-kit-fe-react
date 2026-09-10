import React, { useState, useEffect } from 'react'
import { api } from '@/api/client'
import type { Project, ApiKey, PaginatedResponse } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Key, Trash2, Copy, Check, SlidersHorizontal, RefreshCw, CheckSquare, Square, AlertTriangle } from 'lucide-react'

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  // Selected Project for API Keys / Settings / Delete
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKeySecret, setCreatedKeySecret] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)

  // Settings Edit Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [variantsJson, setVariantsJson] = useState('')
  const [settingsError, setSettingsError] = useState('')

  // Delete Project Modal State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isSoftDelete, setIsSoftDelete] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const fetchProjects = async () => {
    try {
      const res = await api.get<PaginatedResponse<Project>>('/projects')
      setProjects(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/projects', {
        name: newProjectName,
        description: newProjectDesc || undefined,
        settings: {
          variants: {
            thumbnail: { width: 150, height: 150, fit: 'cover', format: 'webp', quality: 80 },
            card: { width: 600, fit: 'contain', format: 'jpg', quality: 85 }
          }
        }
      })
      setIsCreateOpen(false)
      setNewProjectName('')
      setNewProjectDesc('')
      fetchProjects()
    } catch {
      alert('Failed to create project')
    }
  }

  const handleOpenKeys = async (project: Project) => {
    setSelectedProject(project)
    setIsKeyModalOpen(true)
    setCreatedKeySecret('')
    try {
      const res = await api.get<PaginatedResponse<ApiKey>>(`/projects/${project.id}/keys`)
      setApiKeys(res.data.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    try {
      const res = await api.post<ApiKey>(`/projects/${selectedProject.id}/keys`, {
        name: newKeyName
      })
      if (res.data.key) {
        setCreatedKeySecret(res.data.key)
      }
      setNewKeyName('')
      handleOpenKeys(selectedProject)
    } catch {
      alert('Failed to create API Key')
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!selectedProject || !confirm('Permanently delete this API Key?')) return
    try {
      await api.delete(`/projects/${selectedProject.id}/keys/${keyId}`)
      handleOpenKeys(selectedProject)
    } catch {
      alert('Failed to delete key')
    }
  }

  const handleOpenSettings = (project: Project) => {
    setSelectedProject(project)
    setVariantsJson(JSON.stringify(project.settings.variants || {}, null, 2))
    setSettingsError('')
    setIsSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    if (!selectedProject) return
    try {
      const parsedVariants = JSON.parse(variantsJson)
      await api.put(`/projects/${selectedProject.id}`, {
        settings: { variants: parsedVariants }
      })
      setIsSettingsOpen(false)
      fetchProjects()
    } catch {
      setSettingsError('Invalid JSON format. Please verify variants structure.')
    }
  }

  const handleSyncVariants = async (projectId: string) => {
    try {
      await api.post(`/projects/${projectId}/sync-variants`)
      alert('Triggered variant regeneration sync for all project images!')
    } catch {
      alert('Failed to trigger variant sync')
    }
  }

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return
    setDeleting(true)
    try {
      const queryParam = isSoftDelete ? '' : '?permanent=true'
      await api.delete(`/projects/${projectToDelete.id}${queryParam}`)
      setProjectToDelete(null)
      fetchProjects()
    } catch {
      alert('Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage multi-tenant media projects and configure image variant transformation rules
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading projects...</div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold">No Projects Created</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first project to start generating API keys and uploading media blobs.</p>
          <Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const variantCount = Object.keys(project.settings.variants || {}).length
            return (
              <Card key={project.id} className="flex flex-col justify-between hover:shadow-md transition-shadow border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{project.description || 'No description provided'}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary">{variantCount} Variants</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProjectToDelete(project)
                          setIsSoftDelete(true)
                        }}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Created: <span className="font-medium text-foreground">{formatDate(project.created_at)}</span></p>
                    <p>ID: <span className="font-mono text-[11px] text-muted-foreground">{project.id}</span></p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-2.5 text-xs font-mono border">
                    <p className="font-semibold text-muted-foreground uppercase text-[10px] mb-1">Defined Variants</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(project.settings.variants || {}).map((v) => (
                        <span key={v} className="bg-background px-2 py-0.5 rounded border text-[11px]">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleOpenKeys(project)} title="Manage API Keys">
                      <Key className="h-3.5 w-3.5" />
                      <span>Keys</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenSettings(project)} title="Variant Settings">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>Settings</span>
                    </Button>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => handleSyncVariants(project.id)} title="Regenerate All Variants">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Project Modal with Soft/Hard option */}
      <Dialog open={!!projectToDelete} onClose={() => setProjectToDelete(null)} title={`Delete Project - ${projectToDelete?.name}`}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">Confirm Project Deletion</p>
              <p className="mt-0.5 text-muted-foreground">Choose whether to soft-delete (recoverable within 30 days) or permanently purge immediately.</p>
            </div>
          </div>

          <label
            onClick={() => setIsSoftDelete(!isSoftDelete)}
            className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/30 cursor-pointer select-none"
          >
            {isSoftDelete ? (
              <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-semibold text-foreground">Soft Delete (Pre-checked / Safe)</span>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                {isSoftDelete
                  ? 'Retains project assets for 30 days before auto-cleanup. Can be restored anytime via API.'
                  : '⚠️ UNCHECKED: Hard Delete selected! All S3 original files, variants, and DB records will be permanently purged immediately.'}
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setProjectToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant={isSoftDelete ? 'default' : 'destructive'}
              onClick={handleConfirmDeleteProject}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : isSoftDelete ? 'Soft Delete Project' : 'Permanently Delete'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Project Name</label>
            <Input
              type="text"
              placeholder="e.g. Mobile Application Assets"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Description</label>
            <Input
              type="text"
              placeholder="Brief description of this project"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Dialog>

      {/* API Keys Modal */}
      <Dialog open={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} title={`API Keys - ${selectedProject?.name}`} className="max-w-xl">
        <div className="space-y-4">
          {createdKeySecret && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <p className="text-xs font-semibold text-emerald-600">New Secret Key Generated!</p>
              <div className="flex items-center gap-2">
                <Input type="text" readOnly value={createdKeySecret} className="font-mono text-xs bg-background" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdKeySecret)
                    setCopiedKey(true)
                    setTimeout(() => setCopiedKey(false), 2000)
                  }}
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Copy this key now. It will not be shown again.</p>
            </div>
          )}

          <form onSubmit={handleCreateKey} className="flex gap-2">
            <Input
              type="text"
              placeholder="Key label (e.g. Upload Service)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
            />
            <Button type="submit" className="shrink-0">Create Key</Button>
          </form>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">Active API Keys</h4>
            {apiKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No API keys generated yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-xs">
                    <div>
                      <p className="font-medium text-foreground">{k.name}</p>
                      <p className="text-muted-foreground text-[11px]">Created {formatDate(k.created_at)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(k.id)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Settings / Variant Rules Modal */}
      <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title={`Variant Presets - ${selectedProject?.name}`} className="max-w-xl">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure image variant rules for this project in JSON format. Each variant can define dimensions (`width`, `height`), fit mode (`contain`, `cover`, `fill`), output format (`webp`, `jpg`, `avif`, `png`), and JPEG `quality` (1-100).
          </p>

          {settingsError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {settingsError}
            </div>
          )}

          <textarea
            value={variantsJson}
            onChange={(e) => setVariantsJson(e.target.value)}
            className="w-full h-56 font-mono text-xs p-3 rounded-lg border bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="{}"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings}>Save Configuration</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
