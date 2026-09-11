import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover border border-primary/20",
        destructive:
          "bg-destructive/90 text-destructive-foreground shadow-sm hover:bg-destructive border border-destructive/30",
        outline:
          "border border-border/80 bg-background/50 hover:bg-secondary/80 hover:text-foreground text-foreground shadow-sm backdrop-blur-sm",
        secondary:
          "bg-secondary/70 text-secondary-foreground hover:bg-secondary border border-border/40",
        ghost:
          "hover:bg-muted/70 hover:text-foreground text-muted-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        subtle:
          "bg-white/[0.03] hover:bg-white/[0.08] text-foreground border border-white/[0.08]",
      },
      size: {
        default: "h-8 px-3.5 py-1.5",
        sm: "h-7 rounded-md px-2.5 text-[11px]",
        lg: "h-9 rounded-md px-5 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
