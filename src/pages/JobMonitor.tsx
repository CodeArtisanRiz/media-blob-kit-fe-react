import React, { useState, useEffect } from 'react'
import { api } from '@/api/client'
import type { JobItem } from '@/types/api'
import { formatDate } from '@/lib/utils'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
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

  const fetchJobs = async () => {
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
  }

  useEffect(() => {
    fetchJobs()

    const sseUrl = `${import.meta.env.VITE_API_URL || '/api'}/admin/jobs/events`
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
  }, [])

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Live Job Monitor</h2>
            {sseConnected ? (
              <Badge variant="success" className="gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SSE Stream Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Polling Fallback
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time background worker task queue and variant rendering status
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchJobs} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Pending</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Jobs waiting in queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Processing</span>
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{processingCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Currently executing tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold uppercase text-muted-foreground">Failed</span>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{failedCount}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Errors requiring inspection</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(['all', 'pending', 'processing', 'completed', 'failed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-colors ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading job stream...</div>
      ) : filteredJobs.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground text-sm">
          No jobs found for status filter: <span className="font-semibold uppercase text-foreground">{activeTab}</span>
        </Card>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 pl-4">Job ID</th>
                  <th className="p-3">File ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Updated At</th>
                  <th className="p-3 pr-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y font-mono">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 pl-4 font-medium text-foreground">{job.id.slice(0, 8)}...</td>
                    <td className="p-3 text-muted-foreground">{job.file_id.slice(0, 8)}...</td>
                    <td className="p-3">
                      {job.status === 'completed' && <Badge variant="success">Completed</Badge>}
                      {job.status === 'processing' && <Badge variant="warning">Processing</Badge>}
                      {job.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                      {job.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(job.updated_at)}</td>
                    <td className="p-3 pr-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedJob(job)} className="h-7 text-xs gap-1">
                        <Eye className="h-3.5 w-3.5" />
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
      <Dialog open={!!selectedJob} onClose={() => setSelectedJob(null)} title={`Job Details - ${selectedJob?.id}`} className="max-w-xl">
        {selectedJob && (
          <div className="space-y-4 text-xs font-mono">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Job Status</p>
              <Badge variant={selectedJob.status === 'completed' ? 'success' : selectedJob.status === 'failed' ? 'destructive' : 'secondary'}>
                {selectedJob.status}
              </Badge>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Payload JSON</p>
              <pre className="p-3 rounded-lg border bg-muted/40 overflow-x-auto text-[11px]">
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
