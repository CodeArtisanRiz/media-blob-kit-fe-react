import React, { useState, useEffect } from 'react'
import { api } from '@/api/client'
import type { Project, ApiKey, PaginatedResponse } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Key, Trash2, Copy, Check, SlidersHorizontal, RefreshCw, CheckSquare, Square, AlertTriangle, Layers } from 'lucide-react'

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

  const fetchProjects = React.useCallback(async () => {
    try {
      const res = await api.get<PaginatedResponse<Project>>('/projects')
      setProjects(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Projects</h2>
            <Badge variant="secondary" className="font-mono">{projects.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage multi-tenant storage buckets, API keys, and image transformation presets
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 bg-transparent">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No Projects Configured</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">Create a project to obtain scoped API keys and define automatic image resizing pipelines.</p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">Create First Project</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const variantCount = Object.keys(project.settings.variants || {}).length
            return (
              <Card key={project.id} className="flex flex-col justify-between group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate group-hover:text-primary transition-colors">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1 min-h-[32px]">{project.description || 'No description provided'}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                      </Badge>
                      <button
                        onClick={() => {
                          setProjectToDelete(project)
                          setIsSoftDelete(true)
                        }}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2.5 pt-0">
                  <div className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                    <p className="truncate">ID: <span className="text-foreground/80">{project.id}</span></p>
                    <p>Created: <span className="text-foreground/80 font-sans">{formatDate(project.created_at)}</span></p>
                  </div>

                  <div className="rounded-md bg-background/50 p-2 text-xs font-mono border border-border/60">
                    <p className="font-semibold text-muted-foreground uppercase text-[9px] mb-1 tracking-wider">Configured Variants</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.keys(project.settings.variants || {}).length === 0 ? (
                        <span className="text-[10px] text-muted-foreground italic">None configured</span>
                      ) : (
                        Object.keys(project.settings.variants || {}).map((v) => (
                          <span key={v} className="bg-card px-1.5 py-0.5 rounded border border-border/70 text-[10px] text-foreground/90">
                            {v}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 bg-background/20">
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => handleOpenKeys(project)} title="Manage API Keys" className="gap-1 text-[11px]">
                      <Key className="h-3 w-3 text-muted-foreground" />
                      <span>API Keys</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenSettings(project)} title="Variant Settings" className="gap-1 text-[11px]">
                      <SlidersHorizontal className="h-3 w-3 text-muted-foreground" />
                      <span>Presets</span>
                    </Button>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => handleSyncVariants(project.id)} title="Regenerate All Variants" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Project Modal */}
      <Dialog open={!!projectToDelete} onClose={() => setProjectToDelete(null)} title={`Delete Project`}>
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-400">Confirm Deletion of "{projectToDelete?.name}"</p>
              <p className="mt-0.5 text-muted-foreground text-[11px]">Select deletion safety mode before confirming.</p>
            </div>
          </div>

          <div
            onClick={() => setIsSoftDelete(!isSoftDelete)}
            className="flex items-start gap-2.5 p-3 rounded-lg border border-border/80 bg-background/50 cursor-pointer select-none transition-colors hover:border-border"
          >
            {isSoftDelete ? (
              <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-medium text-foreground">Soft Delete (Safe Mode)</span>
              <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                {isSoftDelete
                  ? 'Retains original assets and variants for 30 days before background cleanup. Can be restored anytime.'
                  : '⚠️ UNCHECKED: Hard Delete! Original assets, all S3 variant objects, and DB records will be permanently destroyed immediately.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setProjectToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant={isSoftDelete ? 'default' : 'destructive'}
              size="sm"
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
        <form onSubmit={handleCreateProject} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Project Name</label>
            <Input
              type="text"
              placeholder="e.g. Mobile Application Media"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Description</label>
            <Input
              type="text"
              placeholder="Brief description of usage"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">Create Project</Button>
          </div>
        </form>
      </Dialog>

      {/* API Keys Modal */}
      <Dialog open={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} title={`API Keys - ${selectedProject?.name}`} className="max-w-md">
        <div className="space-y-4">
          {createdKeySecret && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
              <p className="text-xs font-semibold text-emerald-400">New Secret Key Generated</p>
              <div className="flex items-center gap-1.5">
                <Input type="text" readOnly value={createdKeySecret} className="font-mono text-xs bg-background/80" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdKeySecret)
                    setCopiedKey(true)
                    setTimeout(() => setCopiedKey(false), 2000)
                  }}
                  className="shrink-0"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Copy this key now. It is hashed and cannot be shown again.</p>
            </div>
          )}

          <form onSubmit={handleCreateKey} className="flex gap-2">
            <Input
              type="text"
              placeholder="Key label (e.g. Production Upload Service)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
            />
            <Button type="submit" size="sm" className="shrink-0">Create Key</Button>
          </form>

          <div className="space-y-2">
            <h4 className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Active Scoped Keys</h4>
            {apiKeys.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 italic">No active API keys yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-2.5 rounded-md border border-border/70 bg-card text-xs">
                    <div>
                      <p className="font-medium text-foreground">{k.name}</p>
                      <p className="text-muted-foreground font-mono text-[10px]">{formatDate(k.created_at)}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(k.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3" />
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
        <div className="space-y-3.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Define image variant transformations in JSON format (`width`, `height`, `fit: cover|contain|fill`, `format: webp|jpg|avif|png`, and `quality: 1-100`).
          </p>

          {settingsError && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {settingsError}
            </div>
          )}

          <textarea
            value={variantsJson}
            onChange={(e) => setVariantsJson(e.target.value)}
            className="w-full h-60 font-mono text-xs p-3 rounded-md border border-border/80 bg-background/50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            placeholder="{}"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveSettings}>Save Configuration</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
