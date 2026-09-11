import React, { useState, useEffect } from 'react'
import { api, API_BASE_URL } from '@/api/client'
import type { FileItem, Project, PaginatedResponse } from '@/types/api'
import { formatDate, formatBytes } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { UploadCloud, FileText, ExternalLink, Trash2, Filter, CheckSquare, Square, ImageIcon } from 'lucide-react'

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

    const initialVariants: Record<string, boolean> = {}
    Object.keys(activeProject.settings.variants || {}).forEach((v) => {
      initialVariants[v] = true
    })
    setSelectedVariants(initialVariants)

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
          <h3 className="text-sm font-semibold text-foreground">No Media Blobs Found</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Upload an image to trigger the variant pipeline.</p>
          <Button onClick={handleOpenUpload} size="sm">Upload File</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const isImage = file.mime_type.startsWith('image/')
            const variantKeys = Object.keys(file.variants || {})

            return (
              <Card key={file.id} className="overflow-hidden flex flex-col justify-between group">
                {/* Media Preview Header */}
                <div className="h-40 bg-black/40 border-b border-border/60 flex items-center justify-center relative overflow-hidden">
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
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                  )}

                  <a
                    href={`${API_BASE_URL}/files/${file.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 backdrop-blur-[2px]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open Raw</span>
                  </a>
                </div>

                {/* Info Content */}
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs truncate text-foreground" title={file.filename}>{file.filename}</p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{formatBytes(file.size)} • {file.mime_type}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Generated Variant Pills */}
                  {variantKeys.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <p className="text-[9px] uppercase font-semibold text-muted-foreground tracking-wider">Variants</p>
                      <div className="flex flex-wrap gap-1">
                        {variantKeys.map((vk) => (
                          <a
                            key={vk}
                            href={file.variants[vk]}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-background hover:bg-primary hover:text-primary-foreground transition-colors border border-border/70"
                          >
                            {vk}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <div className="px-3.5 py-1.5 bg-background/40 border-t border-border/50 text-[10px] font-mono text-muted-foreground flex justify-between">
                  <span>{formatDate(file.created_at)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onClose={() => setIsUploadOpen(false)} title={`Upload Asset - ${activeProject?.name}`} className="max-w-md">
        <form onSubmit={handleUploadSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Scoped API Key</label>
            {apiKeys.length === 0 ? (
              <p className="text-xs text-destructive">No API keys found for this project. Create a key in Projects tab first.</p>
            ) : (
              <select
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="w-full h-8 rounded-md border border-border/80 bg-background/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">Select Scoped Key...</option>
                {apiKeys.map((k) => (
                  <option key={k.id} value={k.name} className="bg-card text-foreground">
                    {k.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider">File Attachment</label>
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
            <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-background/40">
              <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-wider block">
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
            <Button type="submit" size="sm" disabled={uploading || !selectedApiKey || !selectedFile}>
              {uploading ? 'Uploading...' : 'Upload Asset'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
