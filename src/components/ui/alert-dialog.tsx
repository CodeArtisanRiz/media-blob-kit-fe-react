import * as React from "react"
import { AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface AlertDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onClose: () => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  variant?: "destructive" | "default"
  children?: React.ReactNode
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
  variant = "destructive",
  children,
}: AlertDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div
        className="relative w-full max-w-md rounded-xl border border-white/[0.1] bg-[#0f1011] p-6 text-card-foreground shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground focus:outline-none disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              variant === "destructive"
                ? "bg-destructive/10 border-destructive/25 text-destructive"
                : "bg-primary/10 border-primary/25 text-primary"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>

          <div className="space-y-1 pr-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground leading-tight">
              {title}
            </h3>
            {description && (
              <div className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                {description}
              </div>
            )}
          </div>
        </div>

        {children && <div className="mb-4">{children}</div>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="text-xs h-8"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="text-xs h-8 min-w-[70px]"
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
