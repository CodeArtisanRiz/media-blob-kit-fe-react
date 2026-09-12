import React, { useState, useEffect, useCallback } from 'react'
import { api, API_BASE_URL } from '@/api/client'
import type { FileItem, Project, PaginatedResponse } from '@/types/api'
import { formatDate, formatBytes } from '@/lib/utils'
import { getKeySecret, saveKeyToVault } from '@/lib/keys'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import {
  UploadCloud,
  FileText,
  ExternalLink,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  ImageIcon,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react'

export const MediaManager: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string }[]>([])
  const [selectedKeyId, setSelectedKeyId] = useState<string>('')
  const [apiKeySecret, setApiKeySecret] = useState<string>('')
  const [showKeySecret, setShowKeySecret] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get<PaginatedResponse<Project>>('/projects')
      setProjects(res.data.data)
      if (res.data.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res.data.data[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }, [selectedProjectId])

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const url = selectedProjectId ? `/files?project_id=${selectedProjectId}` : '/files'
      const res = await api.get<PaginatedResponse<FileItem>>(url)
      setFiles(res.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const activeProject = projects.find((p) => p.id === selectedProjectId)

  const handleOpenUpload = async () => {
    if (!activeProject) return
    setIsUploadOpen(true)
    setSelectedFile(null)

    const initialVariants: Record<string, boolean> = {}
    Object.keys(activeProject.settings.variants || {}).forEach((v) => {
      initialVariants[v] = true
    })
    setSelectedVariants(initialVariants)

    try {
      const res = await api.get<PaginatedResponse<{ id: string; name: string }>>(`/projects/${activeProject.id}/keys`)
      setApiKeys(res.data.data)
      if (res.data.data.length > 0) {
        const firstKey = res.data.data[0]
        setSelectedKeyId(firstKey.id)
        const secret = getKeySecret(firstKey.id)
        if (secret) {
          setApiKeySecret(secret)
        } else {
          setApiKeySecret('')
        }
      } else {
        setSelectedKeyId('')
        setApiKeySecret('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleKeySelectChange = (keyId: string) => {
    setSelectedKeyId(keyId)
    const secret = getKeySecret(keyId)
    if (secret) {
      setApiKeySecret(secret)
    } else {
      setApiKeySecret('')
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !apiKeySecret.trim() || !activeProject) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const isImage = selectedFile.type.startsWith('image/')
      const endpoint = isImage ? '/upload/image' : '/upload/file'

      const selectedVariantNames = Object.entries(selectedVariants)
        .filter(([, checked]) => checked)
        .map(([name]) => name)
        .join(',')

      const queryParam = isImage && selectedVariantNames ? `?variants=${encodeURIComponent(selectedVariantNames)}` : ''

      await api.post(`${endpoint}${queryParam}`, formData, {
        headers: {
          'x-api-key': apiKeySecret.trim(),
          'Content-Type': 'multipart/form-data',
        },
      })

      if (selectedKeyId) {
        const keyItem = apiKeys.find((k) => k.id === selectedKeyId)
        saveKeyToVault({
          keyId: selectedKeyId,
          name: keyItem ? keyItem.name : 'Stored Key',
          secret: apiKeySecret.trim(),
          projectId: activeProject.id,
        })
      }

      setIsUploadOpen(false)
      fetchFiles()
    } catch {
      alert('Upload failed. Please check your API Key and file format.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Permanently delete this file and its S3 variants?')) return
    try {
      await api.delete(`/files/${fileId}`)
      fetchFiles()
    } catch {
      alert('Failed to delete file')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Media Gallery</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
              {files.length} objects
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspect stored blobs, preview rendered variants, and upload source files
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Project Selector Filter */}
          <div className="flex items-center gap-1.5 border border-border/80 rounded-md px-2.5 py-1 bg-background/50 text-xs shadow-sm">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent focus:outline-none font-medium text-foreground cursor-pointer text-xs pr-1"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleOpenUpload} className="gap-1.5" size="sm">
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload</span>
          </Button>
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Loading media gallery...
        </div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 bg-transparent text-muted-foreground text-xs">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
            <ImageIcon className="h-5 w-5" />
          </div>
          <p className="font-semibold text-foreground text-sm">No files uploaded yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Upload your first asset using a scoped API key to trigger variant generation.</p>
          <Button onClick={handleOpenUpload} size="sm">Upload Object</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const isImg = file.mime_type.startsWith('image/')
            const fullUrl = file.url.startsWith('http') ? file.url : `${API_BASE_URL}${file.url}`

            return (
              <Card key={file.id} className="overflow-hidden flex flex-col justify-between group">
                <div className="aspect-video bg-muted/40 relative flex items-center justify-center border-b border-border/50 overflow-hidden">
                  {isImg ? (
                    <img
                      src={fullUrl}
                      alt={file.filename}
                      className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-muted-foreground/60" />
                  )}

                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-md backdrop-blur-md">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-white hover:bg-white/20 transition-colors"
                      title="Open source file"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 rounded text-red-400 hover:bg-white/20 transition-colors"
                      title="Delete Object"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-xs truncate text-foreground flex-1" title={file.filename}>
                      {file.filename}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {formatBytes(file.size)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span className="truncate max-w-[120px]">{file.mime_type}</span>
                    <span className="truncate">{file.id.slice(0, 8)}</span>
                  </div>

                  {Object.keys(file.variants || {}).length > 0 && (
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1 tracking-wider">
                        Rendered Variants
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(file.variants).map(([vk, vUrl]) => (
                          <a
                            key={vk}
                            href={vUrl.startsWith('http') ? vUrl : `${API_BASE_URL}${vUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors"
                          >
                            {vk}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="px-3 py-1.5 bg-background/40 border-t border-border/50 text-[10px] font-mono text-muted-foreground flex justify-between">
                  <span>{formatDate(file.created_at)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} title={`Upload Asset - ${activeProject?.name}`} className="max-w-md">
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-1">
          {/* Scoped API Key Selector & Secret Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">
                Scoped API Key
              </label>
              {apiKeys.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {apiKeys.length} available
                </span>
              )}
            </div>

            {apiKeys.length === 0 ? (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                No API keys found for this project. Please create an API Key in the Projects tab first.
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedKeyId}
                  onChange={(e) => handleKeySelectChange(e.target.value)}
                  className="w-full h-8 rounded-md border border-border/80 bg-background/70 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  {apiKeys.map((k) => (
                    <option key={k.id} value={k.id} className="bg-card text-foreground">
                      {k.name} ({k.id.slice(0, 8)}...)
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Key className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type={showKeySecret ? 'text' : 'password'}
                    placeholder="Enter or paste mbk_... secret"
                    value={apiKeySecret}
                    onChange={(e) => setApiKeySecret(e.target.value)}
                    className="pl-8 pr-8 font-mono text-xs h-8 bg-background/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeySecret(!showKeySecret)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    title={showKeySecret ? 'Hide secret' : 'Reveal secret'}
                  >
                    {showKeySecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">
              File Attachment
            </label>
            <Input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0])
                }
              }}
              required
              className="h-9 py-1.5"
            />
          </div>

          {/* Per-Upload Variant Checklist */}
          {selectedFile?.type.startsWith('image/') && activeProject?.settings.variants && (
            <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-background/40">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">
                Variant Transformation Checklist
              </label>
              <div className="space-y-1.5 pt-0.5">
                {Object.keys(activeProject.settings.variants).map((vName) => (
                  <div
                    key={vName}
                    onClick={() =>
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [vName]: !prev[vName],
                      }))
                    }
                    className="flex items-center gap-2 text-xs font-mono cursor-pointer select-none"
                  >
                    {selectedVariants[vName] ? (
                      <CheckSquare className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="text-foreground">{vName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={uploading || !apiKeySecret.trim() || !selectedFile}>
              {uploading ? 'Uploading...' : 'Upload Asset'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
