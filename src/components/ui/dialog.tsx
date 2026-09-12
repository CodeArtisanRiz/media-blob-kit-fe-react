import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function Dialog({
  open,
  onClose,
  children,
  title,
  description,
  className
}: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className={cn(
          "relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl border border-white/[0.1] bg-card/95 text-card-foreground shadow-linear-elevated backdrop-blur-xl animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground focus:outline-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {title && (
          <div className="shrink-0 p-6 pb-4 border-b border-white/[0.05]">
            <h2 className="text-base font-semibold leading-none tracking-tight text-foreground pr-6">{title}</h2>
            {description && (
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed pr-6">{description}</p>
            )}
          </div>
        )}

        <div className="overflow-y-auto p-6 pt-5 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
