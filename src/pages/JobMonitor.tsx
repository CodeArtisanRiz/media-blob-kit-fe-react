import React, { useState, useEffect } from 'react'
import { api, API_BASE_URL } from '@/api/client'
import type { JobItem } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Clock, CheckCircle2, XCircle, Loader2, RefreshCw, Eye } from 'lucide-react'

export const JobMonitor: React.FC = () => {
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all')
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null)
  const [sseConnected, setSseConnected] = useState(false)

  const fetchJobs = React.useCallback(async () => {
    try {
      const res = await api.get<Record<string, { jobs: JobItem[] }>>('/admin/jobs')
      const allJobs: JobItem[] = []
      Object.values(res.data).forEach((proj) => {
        if (proj.jobs) allJobs.push(...proj.jobs)
      })
      allJobs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setJobs(allJobs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()

    const token = localStorage.getItem('access_token')
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''
    const sseUrl = `${API_BASE_URL}/admin/jobs/events${tokenQuery}`
    const es = new EventSource(sseUrl)
    es.onopen = () => setSseConnected(true)
    es.onerror = () => setSseConnected(false)

    es.addEventListener('job_update', (event) => {
      try {
        const updatedJob: JobItem = JSON.parse(event.data)
        setJobs((prev) => {
          const index = prev.findIndex((j) => j.id === updatedJob.id)
          if (index !== -1) {
            const next = [...prev]
            next[index] = updatedJob
            return next
          } else {
            return [updatedJob, ...prev]
          }
        })
      } catch (err) {
        console.error('Failed to parse SSE job event:', err)
      }
    })

    return () => {
      es.close()
    }
  }, [fetchJobs])

  const filteredJobs = jobs.filter((j) => {
    if (activeTab === 'all') return true
    return j.status === activeTab
  })

  const pendingCount = jobs.filter((j) => j.status === 'pending').length
  const processingCount = jobs.filter((j) => j.status === 'processing').length
  const completedCount = jobs.filter((j) => j.status === 'completed').length
  const failedCount = jobs.filter((j) => j.status === 'failed').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Live Job Monitor</h2>
            {sseConnected ? (
              <Badge variant="success" className="gap-1 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SSE Stream Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-muted-foreground gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                Polling Fallback
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time asynchronous image processing queue and background variant pipelines
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchJobs} className="gap-1.5 self-start sm:self-auto">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight">{pendingCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Jobs awaiting worker pickup</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Processing</span>
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight">{processingCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Currently transforming</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Completed</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight">{completedCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Variants rendered & synced</p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Failed</span>
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight">{failedCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pipeline processing errors</p>
          </div>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((tab) => {
          const count =
            tab === 'all'
              ? jobs.length
              : tab === 'pending'
              ? pendingCount
              : tab === 'processing'
              ? processingCount
              : tab === 'completed'
              ? completedCount
              : failedCount

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-secondary text-foreground border border-border shadow-sm font-semibold'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent'
              }`}
            >
              <span>{tab}</span>
              <span className="text-[9px] font-mono opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 font-mono">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Streaming queue telemetry...
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 bg-transparent text-muted-foreground text-xs">
          No tasks found matching filter: <span className="font-semibold uppercase text-foreground">{activeTab}</span>
        </Card>
      ) : (
        <div className="border border-border/80 rounded-lg bg-card/60 overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-background/80 border-b border-border/70 text-[10px] font-medium uppercase text-muted-foreground tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Job ID</th>
                  <th className="py-2.5 px-3">File ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 font-sans">Timestamp</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="py-2.5 px-4 font-medium text-foreground">
                      <span className="text-primary">{job.id.slice(0, 8)}</span>
                      <span className="text-muted-foreground/60">{job.id.slice(8, 14)}...</span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {job.file_id ? `${job.file_id.slice(0, 10)}...` : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {job.status === 'completed' && <Badge variant="success">Completed</Badge>}
                      {job.status === 'processing' && <Badge variant="warning">Processing</Badge>}
                      {job.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                      {job.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground font-sans text-[11px]">
                      {formatDate(job.updated_at)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedJob(job)} className="h-6 text-[11px] gap-1 font-sans">
                        <Eye className="h-3 w-3" />
                        <span>Payload</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payload Modal */}
      <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} title={`Job Telemetry - ${selectedJob?.id}`} className="max-w-xl">
        {selectedJob && (
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/50 font-sans">
              <div>
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Current State</p>
                <div className="mt-1">
                  <Badge variant={selectedJob.status === 'completed' ? 'success' : selectedJob.status === 'failed' ? 'destructive' : 'secondary'}>
                    {selectedJob.status}
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Updated At</p>
                <p className="text-xs text-foreground font-mono mt-0.5">{formatDate(selectedJob.updated_at)}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 font-sans">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Payload Parameters</p>
                <span className="text-[10px] text-muted-foreground font-mono">JSON</span>
              </div>
              <pre className="p-3.5 rounded-lg border border-border/80 bg-background/70 overflow-x-auto text-[11px] leading-relaxed text-foreground/90 font-mono shadow-inner">
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
