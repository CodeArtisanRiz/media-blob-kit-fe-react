import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastVariant = 'default' | 'success' | 'destructive' | 'info'

export interface ToastItem {
  id: string
  title?: string
  description?: React.ReactNode
  variant?: ToastVariant
  duration?: number
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
  toasts: ToastItem[]
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).slice(2, 9)
      const newToast: ToastItem = { id, title, description, variant, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }

      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const Toaster: React.FC<{ toasts: ToastItem[]; dismiss: (id: string) => void }> = ({
  toasts,
  dismiss,
}) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-4 sm:p-0">
      {toasts.map((t) => {
        const isSuccess = t.variant === 'success'
        const isDestructive = t.variant === 'destructive'
        const isInfo = t.variant === 'info'

        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-xl transition-all animate-in slide-in-from-bottom-5 duration-200 text-xs',
              isDestructive
                ? 'bg-[#180808]/90 border-destructive/30 text-destructive-foreground'
                : isSuccess
                ? 'bg-[#09170f]/90 border-emerald-500/30 text-foreground'
                : isInfo
                ? 'bg-[#091220]/90 border-sky-500/30 text-foreground'
                : 'bg-[#0f1011]/90 border-white/[0.1] text-foreground'
            )}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              {isDestructive && <AlertCircle className="h-4 w-4 text-destructive" />}
              {isInfo && <Info className="h-4 w-4 text-sky-400" />}
              {!isSuccess && !isDestructive && !isInfo && (
                <Info className="h-4 w-4 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              {t.title && (
                <p className="font-semibold tracking-tight text-foreground leading-none">
                  {t.title}
                </p>
              )}
              {t.description && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
