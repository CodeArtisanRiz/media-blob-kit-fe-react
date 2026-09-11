import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none tracking-tight",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08]",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
        outline:
          "border-border text-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-400 font-mono",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
