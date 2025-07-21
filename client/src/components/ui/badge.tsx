import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Virgin Atlantic Primary
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        
        // Aviation Status Colors
        safe: "bg-aero-green-safe/20 text-aero-green-safe border border-aero-green-safe/30",
        caution: "bg-aero-amber-caution/20 text-aero-amber-caution border border-aero-amber-caution/30",
        critical: "bg-va-red-primary/20 text-va-red-primary border border-va-red-primary/30",
        info: "bg-aero-blue-primary/20 text-aero-blue-primary border border-aero-blue-primary/30",
        premium: "bg-aero-purple-premium/20 text-aero-purple-premium border border-aero-purple-premium/30",
        
        // Standard variants
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        muted: "bg-surface-secondary text-muted-foreground border border-surface-tertiary",
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