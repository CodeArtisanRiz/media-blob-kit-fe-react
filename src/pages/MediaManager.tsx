import React, { useState, useEffect, useCallback } from 'react'
import { api, API_BASE_URL } from '@/api/client'
import type { FileItem, Project, PaginatedResponse } from '@/types/api'
import { formatDate, formatBytes } from '@/lib/utils'
import { useToast } from '@/context/ToastContext'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Pagination } from '@/components/ui/pagination'
import {
  UploadCloud,
  FileText,
  ExternalLink,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  ImageIcon,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react'

export const MediaManager: React.FC = () => {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, boolean>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Multi-Select Batch Operations
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  // Lightbox / Image Zoom Modal
  const [lightboxFile, setLightboxFile] = useState<FileItem | null>(null)
  const [copiedUrlKey, setCopiedUrlKey] = useState<string | null>(null)

  // Single File Delete State
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null)
  const [deletingFile, setDeletingFile] = useState(false)

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
      const projectParam = selectedProjectId ? `&project_id=${selectedProjectId}` : ''
      const res = await api.get<PaginatedResponse<FileItem>>(`/files?page=${page}&limit=${pageSize}${projectParam}`)
      setFiles(res.data.data)
      setTotalItems(res.data.total_items)
      setTotalPages(res.data.total_pages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId, page, pageSize])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // Clear batch selection when switching projects or pages
  useEffect(() => {
    setSelectedFileIds(new Set())
  }, [selectedProjectId, page])

  const activeProject = projects.find((p) => p.id === selectedProjectId)

  const handleOpenUpload = () => {
    if (!activeProject) return
    setIsUploadOpen(true)
    setSelectedFile(null)
    setUploadProgress(0)

    const initialVariants: Record<string, boolean> = {}
    Object.keys(activeProject.settings.variants || {}).forEach((v) => {
      initialVariants[v] = true
    })
    setSelectedVariants(initialVariants)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !activeProject) return

    setUploading(true)
    setUploadProgress(5)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const isImage = selectedFile.type.startsWith('image/') || /\.(svg|webp|avif|png|jpe?g|gif|bmp|tiff?)$/i.test(selectedFile.name)
      const endpoint = isImage ? '/upload/image' : '/upload/file'

      const selectedVariantNames = Object.entries(selectedVariants)
        .filter(([, checked]) => checked)
        .map(([name]) => name)
        .join(',')

      const queryParam = isImage && selectedVariantNames ? `?variants=${encodeURIComponent(selectedVariantNames)}` : ''

      await api.post(`${endpoint}${queryParam}`, formData, {
        headers: {
          'x-project-id': activeProject.id,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        },
      })

      toast({
        title: 'Asset Uploaded',
        description: `"${selectedFile.name}" stored in bucket "${activeProject.name}".`,
        variant: 'success',
      })

      setIsUploadOpen(false)
      fetchFiles()
    } catch (err: unknown) {
      let errMsg = 'Upload failed. Please verify file format and connectivity.'
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response?: { data?: { error?: string } } }).response
        errMsg = resp?.data?.error || errMsg
      }
      toast({
        title: 'Upload Failed',
        description: errMsg,
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const toggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev)
      if (next.has(fileId)) {
        next.delete(fileId)
      } else {
        next.add(fileId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedFileIds.size === files.length) {
      setSelectedFileIds(new Set())
    } else {
      setSelectedFileIds(new Set(files.map((f) => f.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedFileIds.size === 0) return
    setBatchDeleting(true)
    try {
      let count = 0
      for (const id of Array.from(selectedFileIds)) {
        try {
          await api.delete(`/files/${id}`)
          count += 1
        } catch (e) {
          console.error('Failed to delete file', id, e)
        }
      }

      toast({
        title: 'Batch Delete Completed',
        description: `Deleted ${count} asset(s) and their rendered variants.`,
        variant: 'success',
      })
      setSelectedFileIds(new Set())
      setIsBatchDeleteOpen(false)
      fetchFiles()
    } finally {
      setBatchDeleting(false)
    }
  }

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete) return
    setDeletingFile(true)
    try {
      await api.delete(`/files/${fileToDelete.id}`)
      toast({
        title: 'Object Deleted',
        description: `File "${fileToDelete.filename}" and its rendered variants were removed.`,
        variant: 'success',
      })
      setFileToDelete(null)
      fetchFiles()
    } catch {
      toast({
        title: 'Delete Failed',
        description: 'Unable to delete media object.',
        variant: 'destructive',
      })
    } finally {
      setDeletingFile(false)
    }
  }

  const copyUrlToClipboard = (key: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrlKey(key)
    toast({
      title: 'URL Copied',
      description: 'Asset URL copied to clipboard.',
      variant: 'success',
    })
    setTimeout(() => setCopiedUrlKey(null), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Media Gallery</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
              {totalItems} objects
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
              onChange={(e) => {
                setSelectedProjectId(e.target.value)
                setPage(1)
              }}
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

      {/* Floating Batch Action Toolbar */}
      {selectedFileIds.size > 0 && (
        <div className="sticky top-16 z-20 p-3 rounded-xl bg-[#0f1011]/90 border border-primary/30 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-foreground font-medium hover:text-primary transition-colors"
            >
              {selectedFileIds.size === files.length ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{selectedFileIds.size} selected</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFileIds(new Set())}
              className="text-xs h-7"
            >
              Deselect All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBatchDeleteOpen(true)}
              className="text-xs h-7 gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Selected ({selectedFileIds.size})</span>
            </Button>
          </div>
        </div>
      )}

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
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Upload an image to start transforming assets in bucket "{activeProject?.name || 'default'}".
          </p>
          <Button onClick={handleOpenUpload} size="sm">
            Upload Object
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => {
              const isImg = file.mime_type.startsWith('image/') || /\.(svg|webp|avif|png|jpe?g|gif|bmp|tiff?)$/i.test(file.filename)
              const fullUrl = file.url.startsWith('http') ? file.url : `${API_BASE_URL}${file.url}`
              const isSelected = selectedFileIds.has(file.id)

              return (
                <Card
                  key={file.id}
                  className={`overflow-hidden flex flex-col justify-between group transition-all duration-200 ${
                    isSelected ? 'border-primary ring-1 ring-primary/40 bg-primary/5' : 'hover:border-border'
                  }`}
                >
                  <div className="aspect-video bg-muted/40 relative flex items-center justify-center border-b border-border/50 overflow-hidden">
                    {/* Multi-Select Checkbox Overlay */}
                    <button
                      type="button"
                      onClick={() => toggleSelectFile(file.id)}
                      className="absolute top-2 left-2 z-10 p-1 rounded-md bg-black/60 backdrop-blur-md text-white hover:text-primary transition-colors"
                      title={isSelected ? 'Deselect' : 'Select'}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-white/70" />
                      )}
                    </button>

                    {isImg ? (
                      <img
                        src={fullUrl}
                        alt={file.filename}
                        className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105 cursor-pointer"
                        loading="lazy"
                        onClick={() => setLightboxFile(file)}
                      />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground/60" />
                    )}

                    {/* Quick Action Overlay */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-1 rounded-md backdrop-blur-md z-10">
                      {isImg && (
                        <button
                          onClick={() => setLightboxFile(file)}
                          className="p-1 rounded text-white hover:bg-white/20 transition-colors"
                          title="Open Lightbox Inspector"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-white hover:bg-white/20 transition-colors"
                        title="Open Raw File"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => setFileToDelete(file)}
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

      {/* Image Lightbox & Variant Inspector Modal */}
      <Dialog
        open={!!lightboxFile}
        onClose={() => setLightboxFile(null)}
        title={lightboxFile?.filename || 'Asset Inspector'}
        description={`Size: ${formatBytes(lightboxFile?.size || 0)} • MIME: ${lightboxFile?.mime_type || ''}`}
        className="max-w-3xl"
      >
        {lightboxFile && (
          <div className="space-y-4 pt-1">
            {/* Main Preview Container */}
            <div className="h-72 bg-black/60 rounded-xl border border-border/80 flex items-center justify-center p-4 overflow-hidden relative">
              <img
                src={lightboxFile.url.startsWith('http') ? lightboxFile.url : `${API_BASE_URL}${lightboxFile.url}`}
                alt={lightboxFile.filename}
                className="max-h-full max-w-full object-contain drop-shadow-md"
              />
            </div>

            {/* URL Copy & Variant Matrix */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase text-[10px] text-muted-foreground tracking-wider">
                    Original Source URL
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="text"
                    readOnly
                    value={lightboxFile.url.startsWith('http') ? lightboxFile.url : `${API_BASE_URL}${lightboxFile.url}`}
                    className="font-mono text-xs h-8 bg-background/70"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyUrlToClipboard(
                        'original',
                        lightboxFile.url.startsWith('http') ? lightboxFile.url : `${API_BASE_URL}${lightboxFile.url}`
                      )
                    }
                    className="h-8 shrink-0 gap-1 text-xs"
                  >
                    {copiedUrlKey === 'original' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedUrlKey === 'original' ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              {Object.keys(lightboxFile.variants || {}).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="font-semibold uppercase text-[10px] text-muted-foreground tracking-wider block">
                    Generated CDN Variants ({Object.keys(lightboxFile.variants).length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(lightboxFile.variants).map(([vName, vUrl]) => {
                      const fullVariantUrl = vUrl.startsWith('http') ? vUrl : `${API_BASE_URL}${vUrl}`
                      return (
                        <div
                          key={vName}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background/50 border border-border/70 text-xs"
                        >
                          <span className="font-mono font-medium text-primary text-[11px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                            {vName}
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground truncate flex-1">
                            {fullVariantUrl}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyUrlToClipboard(vName, fullVariantUrl)}
                            className="h-7 px-2 text-[11px] gap-1 shrink-0"
                          >
                            {copiedUrlKey === vName ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedUrlKey === vName ? 'Copied' : 'Copy'}</span>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Shadcn Alert Dialog: Delete Single File */}
      <AlertDialog
        open={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmDeleteFile}
        loading={deletingFile}
        variant="destructive"
        title="Delete Media Object"
        description={`Are you sure you want to delete "${fileToDelete?.filename}"? All rendered S3 variants will be permanently purged.`}
        confirmLabel="Delete Object"
      />

      {/* Shadcn Alert Dialog: Batch Delete Multiple Files */}
      <AlertDialog
        open={isBatchDeleteOpen}
        onClose={() => setIsBatchDeleteOpen(false)}
        onConfirm={handleBatchDelete}
        loading={batchDeleting}
        variant="destructive"
        title="Batch Delete Assets"
        description={`You are about to permanently delete ${selectedFileIds.size} selected assets and all their rendered S3 variants. This action cannot be reversed.`}
        confirmLabel={batchDeleting ? 'Deleting...' : `Delete ${selectedFileIds.size} Assets`}
      />

      {/* Upload Modal with Progress Bar */}
      <Dialog
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title={`Upload Asset - ${activeProject?.name}`}
        description="Upload a source file to S3 and generate configured image variants"
        className="max-w-md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-1">
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
              disabled={uploading}
              className="h-9 py-1.5"
            />
          </div>

          {/* Interactive Percentage Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 p-3 rounded-lg border border-primary/30 bg-primary/5 animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Uploading to S3...</span>
                <span className="font-mono text-primary font-semibold">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary/80 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-150 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Per-Upload Variant Checklist */}
          {(selectedFile?.type.startsWith('image/') || (selectedFile && /\.(svg|webp|avif|png|jpe?g|gif|bmp|tiff?)$/i.test(selectedFile.name))) && activeProject?.settings.variants && (
            <div className="space-y-2 p-3 rounded-lg border border-border/80 bg-background/40">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider block">
                Variant Transformation Checklist
              </label>
              <div className="space-y-1.5 pt-0.5">
                {Object.keys(activeProject.settings.variants).map((vName) => (
                  <div
                    key={vName}
                    onClick={() => {
                      if (uploading) return
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [vName]: !prev[vName],
                      }))
                    }}
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

          <div className="pt-2 flex justify-end gap-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={uploading || !selectedFile}>
              {uploading ? `Uploading (${uploadProgress}%)` : 'Upload Asset'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
