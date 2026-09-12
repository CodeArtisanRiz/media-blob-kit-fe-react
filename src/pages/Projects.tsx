import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'
import type { Project, ApiKey, PaginatedResponse } from '@/types/api'
import { formatDate, formatBytes } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import {
  Plus,
  Key,
  Trash2,
  Copy,
  Check,
  SlidersHorizontal,
  RefreshCw,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  AlertTriangle,
  HardDrive,
  Zap,
} from 'lucide-react'

export const Projects: React.FC = () => {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  // Selected Project for API Keys / Settings / Delete
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKeySecret, setCreatedKeySecret] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [creatingKey, setCreatingKey] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null)
  const [deletingKey, setDeletingKey] = useState(false)

  // Settings Edit Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [variantsJson, setVariantsJson] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  // Delete Project Modal State
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isSoftDelete, setIsSoftDelete] = useState(true)
  const [deletingProject, setDeletingProject] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse<Project>>(`/projects?page=${page}&limit=${pageSize}`)
      setProjects(res.data.data)
      setTotalItems(res.data.total_items)
      setTotalPages(res.data.total_pages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreatingProject(true)
    try {
      await api.post('/projects', {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        settings: {
          variants: {
            thumbnail: { width: 150, height: 150, fit: 'cover', format: 'webp', quality: 80 },
            card: { width: 600, fit: 'contain', format: 'jpg', quality: 85 },
          },
        },
      })
      toast({
        title: 'Project Created',
        description: `Project "${newProjectName}" has been configured with default variant rules.`,
        variant: 'success',
      })
      setIsCreateOpen(false)
      setNewProjectName('')
      setNewProjectDesc('')
      fetchProjects()
    } catch {
      toast({
        title: 'Creation Failed',
        description: 'Unable to create project. Please verify backend connectivity.',
        variant: 'destructive',
      })
    } finally {
      setCreatingProject(false)
    }
  }

  const loadProjectKeys = async (projectId: string) => {
    try {
      const res = await api.get<PaginatedResponse<ApiKey>>(`/projects/${projectId}/keys`)
      setApiKeys(res.data.data)
    } catch (e) {
      console.error('Failed to load project keys', e)
    }
  }

  const handleOpenKeys = (project: Project) => {
    setSelectedProject(project)
    setIsKeyModalOpen(true)
    setCreatedKeySecret('')
    setCopiedKey(false)
    loadProjectKeys(project.id)
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject || !newKeyName.trim()) return

    setCreatingKey(true)
    try {
      const res = await api.post<ApiKey>(`/projects/${selectedProject.id}/keys`, {
        name: newKeyName.trim(),
      })

      if (res.data.key) {
        setCreatedKeySecret(res.data.key)
      }

      toast({
        title: 'API Key Created',
        description: `Scoped key "${res.data.name}" is generated. Copy it now.`,
        variant: 'success',
      })
      setNewKeyName('')
      await loadProjectKeys(selectedProject.id)
    } catch {
      toast({
        title: 'Key Generation Failed',
        description: 'Failed to create scoped API key.',
        variant: 'destructive',
      })
    } finally {
      setCreatingKey(false)
    }
  }

  const handleConfirmDeleteKey = async () => {
    if (!selectedProject || !keyToDelete) return
    setDeletingKey(true)
    try {
      await api.delete(`/projects/${selectedProject.id}/keys/${keyToDelete.id}`)
      toast({
        title: 'API Key Revoked',
        description: `Key "${keyToDelete.name}" has been permanently deleted.`,
        variant: 'success',
      })
      setKeyToDelete(null)
      await loadProjectKeys(selectedProject.id)
    } catch {
      toast({
        title: 'Deletion Failed',
        description: 'Unable to delete API key.',
        variant: 'destructive',
      })
    } finally {
      setDeletingKey(false)
    }
  }

  const handleCopyNewSecret = () => {
    if (!createdKeySecret) return
    navigator.clipboard.writeText(createdKeySecret)
    setCopiedKey(true)
    toast({
      title: 'API Key Copied',
      description: 'Secret key copied to clipboard. Store it in a secure password manager or environment file.',
      variant: 'success',
    })
    setTimeout(() => setCopiedKey(false), 3000)
  }

  const handleOpenSettings = (project: Project) => {
    setSelectedProject(project)
    setVariantsJson(JSON.stringify(project.settings.variants || {}, null, 2))
    setSettingsError('')
    setIsSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    if (!selectedProject) return
    setSavingSettings(true)
    try {
      const parsedVariants = JSON.parse(variantsJson)
      await api.put(`/projects/${selectedProject.id}`, {
        settings: { variants: parsedVariants },
      })
      toast({
        title: 'Variants Updated',
        description: `Updated image transformation presets for "${selectedProject.name}".`,
        variant: 'success',
      })
      setIsSettingsOpen(false)
      fetchProjects()
    } catch {
      setSettingsError('Invalid JSON format. Please verify variants structure.')
      toast({
        title: 'Validation Error',
        description: 'Please correct the JSON formatting before saving.',
        variant: 'destructive',
      })
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSyncVariants = async (projectId: string) => {
    try {
      await api.post(`/projects/${projectId}/sync-variants`)
      toast({
        title: 'Variant Sync Triggered',
        description: 'Dispatched background jobs to regenerate all configured variants.',
        variant: 'success',
      })
    } catch {
      toast({
        title: 'Sync Failed',
        description: 'Failed to trigger background variant pipeline.',
        variant: 'destructive',
      })
    }
  }

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return
    setDeletingProject(true)
    try {
      const queryParam = isSoftDelete ? '' : '?permanent=true'
      await api.delete(`/projects/${projectToDelete.id}${queryParam}`)
      toast({
        title: isSoftDelete ? 'Project Soft Deleted' : 'Project Permanently Deleted',
        description: `Project "${projectToDelete.name}" has been removed.`,
        variant: 'success',
      })
      setProjectToDelete(null)
      fetchProjects()
    } catch {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeletingProject(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Projects</h2>
            <Badge variant="secondary" className="font-mono">
              {totalItems}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage multi-tenant storage buckets, API keys, and image transformation presets
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 self-start sm:self-auto" size="sm">
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
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            Create a project to obtain scoped API keys and define automatic image resizing pipelines.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            Create First Project
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const variantCount = Object.keys(project.settings.variants || {}).length
              const usedBytes = project.storage_used_bytes || 0
              const limitBytes = project.storage_limit_bytes || 5 * 1024 * 1024 * 1024
              const storagePercent = Math.min(100, Math.round((usedBytes / limitBytes) * 100))

              const usedTransforms = project.transforms_used || 0
              const limitTransforms = project.transforms_limit || 10000
              const transformPercent = Math.min(100, Math.round((usedTransforms / limitTransforms) * 100))

              return (
                <Card key={project.id} className="flex flex-col justify-between group hover:border-border transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1 min-h-[32px]">
                          {project.description || 'No description provided'}
                        </CardDescription>
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

                  <CardContent className="space-y-3 pt-0">
                    {/* Storage & Transform Quota Visualizers */}
                    <div className="space-y-2 p-2.5 rounded-md bg-background/50 border border-border/60 text-[11px]">
                      {/* Storage Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider">
                            <HardDrive className="h-3 w-3 text-primary" />
                            <span>Storage</span>
                          </span>
                          <span className="font-mono text-[10px]">
                            {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              storagePercent > 90 ? 'bg-destructive' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.max(2, storagePercent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Transform Bar */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider">
                            <Zap className="h-3 w-3 text-amber-400" />
                            <span>Transforms</span>
                          </span>
                          <span className="font-mono text-[10px]">
                            {usedTransforms.toLocaleString()} / {limitTransforms.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(2, transformPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md bg-background/30 p-2 text-xs font-mono border border-border/50">
                      <p className="font-semibold text-muted-foreground uppercase text-[9px] mb-1 tracking-wider">
                        Configured Variants
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(project.settings.variants || {}).length === 0 ? (
                          <span className="text-[10px] text-muted-foreground italic">None configured</span>
                        ) : (
                          Object.keys(project.settings.variants || {}).map((v) => (
                            <span
                              key={v}
                              className="bg-card px-1.5 py-0.5 rounded border border-border/70 text-[10px] text-foreground/90"
                            >
                              {v}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenKeys(project)}
                        title="Manage API Keys"
                        className="gap-1 text-[11px]"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span>Keys</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSettings(project)}
                        title="Variant Settings"
                        className="gap-1 text-[11px]"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Variants</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSyncVariants(project.id)}
                      title="Regenerate All Variants"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setPage(1)
            }}
          />
        </div>
      )}

      {/* Shadcn Alert Dialog: Delete Project Confirmation */}
      <AlertDialog
        open={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDeleteProject}
        loading={deletingProject}
        variant="destructive"
        title="Delete Project"
        description={`You are about to delete "${projectToDelete?.name}".`}
        confirmLabel={deletingProject ? 'Deleting...' : isSoftDelete ? 'Soft Delete Project' : 'Permanently Delete'}
      >
        <div
          onClick={() => setIsSoftDelete(!isSoftDelete)}
          className="flex items-start gap-2.5 p-3 rounded-md border border-white/[0.08] bg-white/[0.02] cursor-pointer select-none hover:bg-white/[0.05] transition-colors"
        >
          <div className="mt-0.5">
            {isSoftDelete ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="text-xs space-y-0.5">
            <span className="font-medium text-foreground">Soft Delete (Safe Mode - 30 Day Recovery)</span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Retains records and S3 files for 30 days before purge. Uncheck to trigger immediate permanent destruction.
            </p>
          </div>
        </div>
      </AlertDialog>

      {/* Shadcn Alert Dialog: Delete API Key Confirmation */}
      <AlertDialog
        open={!!keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={handleConfirmDeleteKey}
        loading={deletingKey}
        variant="destructive"
        title="Revoke API Key"
        description={`Are you sure you want to delete scoped key "${keyToDelete?.name}"? Any backend pipelines or upload scripts using this key will immediately lose access.`}
        confirmLabel="Revoke Key"
      />

      {/* Create Project Modal */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block">
              Project Name
            </label>
            <Input
              type="text"
              placeholder="e.g. E-Commerce Store"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block">
              Description (Optional)
            </label>
            <Input
              type="text"
              placeholder="Brief summary of project scope"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateOpen(false)} disabled={creatingProject}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={creatingProject || !newProjectName.trim()}>
              {creatingProject ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* API Keys Modal */}
      <Dialog
        open={isKeyModalOpen}
        onClose={() => {
          setIsKeyModalOpen(false)
          setCreatedKeySecret('')
        }}
        title={`API Keys - ${selectedProject?.name}`}
        description="Scoped credentials for external services and upload pipelines"
        className="max-w-lg"
      >
        <div className="space-y-4 pt-1">
          {/* Newly Generated Secret Banner */}
          {createdKeySecret && (
            <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 space-y-3 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  <span>New Secret Key Generated</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                  Copy Now
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  readOnly
                  value={createdKeySecret}
                  className="font-mono text-xs bg-black/50 border-emerald-500/40 text-emerald-200 selection:bg-emerald-500/40 select-all"
                />
                <Button
                  size="sm"
                  onClick={handleCopyNewSecret}
                  className="shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {copiedKey ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-black/40 border border-emerald-500/20 text-[11px] text-muted-foreground leading-relaxed">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Please save this key securely.</strong> For security reasons, the full secret key will not be shown again.
                </span>
              </div>
            </div>
          )}

          {/* Create Key Form */}
          <form onSubmit={handleCreateKey} className="flex gap-2">
            <Input
              type="text"
              placeholder="Key label (e.g. Upload Service)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" disabled={creatingKey || !newKeyName.trim()} className="shrink-0">
              {creatingKey ? 'Generating...' : 'Create Key'}
            </Button>
          </form>

          {/* Active Keys List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Active API Keys ({apiKeys.length})
              </h4>
            </div>

            {apiKeys.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-dashed border-border/80 text-xs text-muted-foreground italic">
                No active API keys created yet. Generate a key above to obtain an `x-api-key` header token.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="p-3 rounded-lg border border-border/80 bg-card/60 backdrop-blur-sm flex items-center justify-between gap-3 transition-all hover:border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs text-foreground truncate">{k.name}</p>
                        {k.is_active && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" title="Active" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mt-0.5">
                        <span>mbk_••••••••••••••••</span>
                        <span>•</span>
                        <span className="font-sans">{formatDate(k.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setKeyToDelete(k)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Key"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)} disabled={savingSettings}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
