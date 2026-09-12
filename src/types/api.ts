export type Role = 'su' | 'admin' | 'user'

export interface User {
  id: string
  username: string
  role: Role
  created_at: string
}

export interface VariantConfig {
  format?: string
  quality?: number
  width?: number
  height?: number
  max_width?: number
  max_height?: number
  fit?: string
}

export interface ProjectSettings {
  variants?: Record<string, VariantConfig>
  keep_original?: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  settings: ProjectSettings
  storage_used_bytes?: number
  storage_limit_bytes?: number
  transforms_used?: number
  transforms_limit?: number
  transforms_total?: number
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  project_id: string
  name: string
  key?: string
  is_active: boolean
  expires_at?: string
  created_at: string
}

export interface FileItem {
  id: string
  project_id: string
  filename: string
  mime_type: string
  size: number
  url: string
  variants: Record<string, string>
  created_at: string
}

export interface JobItem {
  id: string
  file_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  payload: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total_items: number
  total_pages: number
  current_page: number
  page_size: number
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface RefreshResponse {
  access_token: string
  refresh_token: string
}
