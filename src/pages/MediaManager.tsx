import React, { useState, useEffect } from 'react'
import { api, API_BASE_URL } from '@/api/client'
import type { FileItem, Project, PaginatedResponse } from '@/types/api'
import { formatDate, formatBytes } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { UploadCloud, FileText, ExternalLink, Trash2, Filter, CheckSquare, Square } from 'lucide-react'

export const MediaManager: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key?: string }[]>([])
  const [selectedApiKey, setSelectedApiKey] = useState<string>('')
  const [selectedVariants, setSelectedVariants] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState(false)

  const fetchProjects = React.useCallback(async () => {
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

  const fetchFiles = React.useCallback(async () => {
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

    // Reset variant check state to all selected by default
    const initialVariants: Record<string, boolean> = {}
    Object.keys(activeProject.settings.variants || {}).forEach((v) => {
      initialVariants[v] = true
    })
    setSelectedVariants(initialVariants)

    // Fetch keys
    try {
      const res = await api.get<PaginatedResponse<{ id: string; name: string }>>(`/projects/${activeProject.id}/keys`)
      setApiKeys(res.data.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !selectedApiKey || !activeProject) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const isImage = selectedFile.type.startsWith('image/')
      const endpoint = isImage ? '/upload/image' : '/upload/file'

      // Per-upload variant parameter build
      const selectedVariantNames = Object.entries(selectedVariants)
        .filter(([, checked]) => checked)
        .map(([name]) => name)
        .join(',')

      const queryParam = isImage && selectedVariantNames ? `?variants=${encodeURIComponent(selectedVariantNames)}` : ''

      await api.post(`${endpoint}${queryParam}`, formData, {
        headers: {
          'x-api-key': selectedApiKey,
          'Content-Type': 'multipart/form-data',
        },
      })

      setIsUploadOpen(false)
      fetchFiles()
    } catch {
      alert('Upload failed. Please check API Key and file format.')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Media Gallery</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Browse stored media blobs, inspect generated variants, and upload new assets
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector Filter */}
          <div className="flex items-center gap-2 border rounded-lg p-1 px-3 bg-card text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent focus:outline-none font-medium text-foreground cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleOpenUpload} className="gap-2">
            <UploadCloud className="h-4 w-4" />
            <span>Upload Asset</span>
          </Button>
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading file gallery...</div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold">No Files Found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">No files uploaded for this project yet.</p>
          <Button onClick={handleOpenUpload}>Upload First File</Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const isImage = file.mime_type.startsWith('image/')
            const variantKeys = Object.keys(file.variants || {})

            return (
              <Card key={file.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow border-border/80">
                {/* Media Preview Header */}
                <div className="h-44 bg-muted/30 border-b flex items-center justify-center relative group overflow-hidden">
                  {isImage ? (
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground/50" />
                  )}

                  <a
                    href={`${API_BASE_URL}/files/${file.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 backdrop-blur-[2px]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View / Presigned Link</span>
                  </a>
                </div>

                {/* Info Content */}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate">
                      <p className="font-semibold text-sm truncate" title={file.filename}>{file.filename}</p>
                      <p className="text-[11px] text-muted-foreground">{formatBytes(file.size)} • {file.mime_type}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Generated Variant Pills */}
                  {variantKeys.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">Generated Variants</p>
                      <div className="flex flex-wrap gap-1">
                        {variantKeys.map((vk) => (
                          <a
                            key={vk}
                            href={file.variants[vk]}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors border"
                          >
                            {vk}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="px-4 py-2 bg-muted/20 border-t text-[11px] text-muted-foreground flex justify-between">
                  <span>Uploaded {formatDate(file.created_at)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal with Per-Upload Variant Selection */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} title={`Upload Asset - ${activeProject?.name}`} className="max-w-md">
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Select API Key</label>
            {apiKeys.length === 0 ? (
              <p className="text-xs text-destructive">No API keys found for this project. Please create an API Key in Projects first.</p>
            ) : (
              <select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                required
              >
                <option value="">Select Key...</option>
                {apiKeys.map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">File Attachment</label>
            <Input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0])
                }
              }}
              required
            />
          </div>

          {/* Per-Upload Variant Checklist */}
          {selectedFile?.type.startsWith('image/') && activeProject?.settings.variants && (
            <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
              <label className="text-xs font-semibold uppercase text-muted-foreground block">
                Per-Upload Variant Selection
              </label>
              <p className="text-[11px] text-muted-foreground">Check which variants to generate for this specific upload:</p>

              <div className="space-y-1.5 pt-1">
                {Object.keys(activeProject.settings.variants).map((vName) => (
                  <label
                    key={vName}
                    onClick={() =>
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [vName]: !prev[vName],
                      }))
                    }
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none"
                  >
                    {selectedVariants[vName] ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{vName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || !selectedApiKey || !selectedFile}>
              {uploading ? 'Uploading...' : 'Start Upload'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
