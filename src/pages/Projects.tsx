import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/client'
import type { Project, ApiKey, PaginatedResponse } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { saveKeyToVault, removeKeyFromVault, getKeySecret } from '@/lib/keys'
import { useToast } from '@/context/ToastContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'

export const Projects: React.FC = () => {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({})
  const [manualInputKeyId, setManualInputKeyId] = useState<string | null>(null)
  const [manualSecretInput, setManualSecretInput] = useState('')
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
    setManualInputKeyId(null)
    setManualSecretInput('')
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

      const generatedKey = res.data.key
      if (generatedKey) {
        setCreatedKeySecret(generatedKey)
        saveKeyToVault({
          keyId: res.data.id,
          name: res.data.name,
          secret: generatedKey,
          projectId: selectedProject.id,
          createdAt: res.data.created_at,
        })
        setRevealedKeyIds((prev) => ({ ...prev, [res.data.id]: true }))
      }

      toast({
        title: 'API Key Generated',
        description: `Scoped key "${res.data.name}" is active and ready.`,
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
      removeKeyFromVault(keyToDelete.id)
      if (createdKeySecret && createdKeySecret === getKeySecret(keyToDelete.id)) {
        setCreatedKeySecret('')
      }
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

  const toggleRevealKey = (keyId: string) => {
    setRevealedKeyIds((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }))
  }

  const handleCopyKey = (keyId: string, fallbackKey?: string) => {
    const secret = getKeySecret(keyId) || fallbackKey || createdKeySecret
    if (!secret) {
      navigator.clipboard.writeText(keyId)
      setCopiedKeyId(keyId)
      toast({
        title: 'Key ID Copied',
        description: 'Copied key identifier to clipboard.',
        variant: 'info',
      })
      setTimeout(() => setCopiedKeyId(null), 2000)
      return
    }

    navigator.clipboard.writeText(secret)
    setCopiedKeyId(keyId)
    toast({
      title: 'Secret Copied',
      description: 'API key secret copied to clipboard.',
      variant: 'success',
    })
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleSaveManualSecret = (key: ApiKey) => {
    if (!manualSecretInput.trim() || !selectedProject) return
    saveKeyToVault({
      keyId: key.id,
      name: key.name,
      secret: manualSecretInput.trim(),
      projectId: selectedProject.id,
      createdAt: key.created_at,
    })
    setRevealedKeyIds((prev) => ({ ...prev, [key.id]: true }))
    setManualInputKeyId(null)
    setManualSecretInput('')
    toast({
      title: 'Secret Remembered',
      description: `Saved secret token for "${key.name}" to workspace vault.`,
      variant: 'success',
    })
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
              {projects.length}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const variantCount = Object.keys(project.settings.variants || {}).length
            return (
              <Card key={project.id} className="flex flex-col justify-between group">
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

                <CardContent className="space-y-2.5 pt-0">
                  <div className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                    <p className="truncate">
                      ID: <span className="text-foreground/80">{project.id}</span>
                    </p>
                    <p>
                      Created: <span className="text-foreground/80 font-sans">{formatDate(project.created_at)}</span>
                    </p>
                  </div>

                  <div className="rounded-md bg-background/50 p-2 text-xs font-mono border border-border/60">
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
          setManualInputKeyId(null)
        }}
        title={`API Keys - ${selectedProject?.name}`}
        description="Scoped credentials for uploading and transforming blobs via REST API"
        className="max-w-lg"
      >
        <div className="space-y-4 pt-1">
          {/* Newly Generated Secret Banner */}
          {createdKeySecret && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>New API Secret Generated</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Ready to use
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    readOnly
                    value={createdKeySecret}
                    className="font-mono text-xs bg-background/90 pr-9 border-emerald-500/40 text-emerald-300 selection:bg-emerald-500/30"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyKey('new-created', createdKeySecret)}
                  className="shrink-0 gap-1 border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300"
                >
                  {copiedKeyId === 'new-created' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
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

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Copy this key now. It has been saved in your local workspace vault for one-click copying and uploading.
              </p>
            </div>
          )}

          {/* Create Key Form */}
          <form onSubmit={handleCreateKey} className="flex gap-2">
            <Input
              type="text"
              placeholder="Key label (e.g. Production Upload Service)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              required
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" disabled={creatingKey || !newKeyName.trim()} className="shrink-0">
              {creatingKey ? 'Generating...' : 'Generate Key'}
            </Button>
          </form>

          {/* Active Keys List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Active Scoped Keys ({apiKeys.length})
              </h4>
            </div>

            {apiKeys.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-dashed border-border/80 text-xs text-muted-foreground italic">
                No active API keys yet. Generate a key above to start uploading assets.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {apiKeys.map((k) => {
                  const storedSecret =
                    getKeySecret(k.id) ||
                    (createdKeySecret && apiKeys.find((item) => item.id === k.id)?.key === createdKeySecret
                      ? createdKeySecret
                      : null)
                  const isRevealed = !!revealedKeyIds[k.id]
                  const isCopied = copiedKeyId === k.id

                  return (
                    <div
                      key={k.id}
                      className="p-3 rounded-lg border border-border/80 bg-card/60 backdrop-blur-sm space-y-2 transition-all hover:border-border"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs text-foreground truncate">{k.name}</p>
                            {k.is_active && (
                              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" title="Active Key" />
                            )}
                          </div>
                          <p className="text-muted-foreground font-mono text-[10px] mt-0.5">
                            Created: {formatDate(k.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setKeyToDelete(k)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete API Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Key Value Row with Eye toggle and Copy button */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className="flex-1 min-w-0 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-background/80 border border-border/70 font-mono text-[11px] text-foreground">
                          {storedSecret ? (
                            <span className="truncate selection:bg-primary/30">
                              {isRevealed ? storedSecret : `${storedSecret.slice(0, 7)}${'•'.repeat(20)}`}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-[10px]">
                              {isRevealed ? `Key ID: ${k.id}` : '••••••••••••••••••••••••'}
                            </span>
                          )}

                          {storedSecret && (
                            <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 ml-1">
                              Saved
                            </span>
                          )}
                        </div>

                        {/* Eye Reveal Toggle Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => toggleRevealKey(k.id)}
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                          title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                        >
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>

                        {/* Copy Key Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyKey(k.id, storedSecret || undefined)}
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                          title="Copy API Key Secret"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>

                      {/* Optional Manual Store if secret wasn't saved on this machine */}
                      {!storedSecret && manualInputKeyId !== k.id && (
                        <div className="pt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Key generated on another session.</span>
                          <button
                            type="button"
                            onClick={() => {
                              setManualInputKeyId(k.id)
                              setManualSecretInput('')
                            }}
                            className="text-primary hover:underline font-medium"
                          >
                            Paste & Remember Key
                          </button>
                        </div>
                      )}

                      {manualInputKeyId === k.id && (
                        <div className="flex gap-1.5 pt-1">
                          <Input
                            type="text"
                            placeholder="Paste mbk_... secret"
                            value={manualSecretInput}
                            onChange={(e) => setManualSecretInput(e.target.value)}
                            className="h-7 text-[11px] font-mono"
                          />
                          <Button size="sm" className="h-7 text-[10px]" onClick={() => handleSaveManualSecret(k)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setManualInputKeyId(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
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
