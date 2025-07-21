import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Virgin Atlantic Primary - Signature Red
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-va-glow hover:-translate-y-0.5 active:translate-y-0",
        
        // Virgin Atlantic Secondary - Aviation Blue
        secondary: "bg-secondary text-secondary-foreground shadow hover:bg-secondary/90 hover:shadow-aero-glow hover:-translate-y-0.5 active:translate-y-0",
        
        // Success/Safe - Green
        success: "bg-aero-green-safe text-white shadow hover:bg-aero-green-light hover:shadow-lg",
        
        // Warning/Caution - Amber
        warning: "bg-aero-amber-caution text-white shadow hover:bg-aero-amber-light hover:shadow-lg",
        
        // Destructive/Critical - Red
        destructive: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 hover:shadow-lg",
        
        // Premium - Purple
        premium: "bg-aero-purple-premium text-white shadow hover:opacity-90 hover:shadow-lg",
        
        // Outline variants
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground shadow-sm",
        "outline-secondary": "border-2 border-va-blue bg-transparent text-va-blue hover:bg-va-blue hover:text-va-cloud-white shadow-sm",
        
        // Ghost variants
        ghost: "bg-transparent text-foreground hover:bg-muted hover:text-accent-foreground",
        "ghost-red": "bg-transparent text-va-red hover:bg-va-red/10",
        "ghost-blue": "bg-transparent text-va-blue hover:bg-va-blue/10",
        
        // Muted
        muted: "bg-surface-secondary text-muted-foreground hover:bg-surface-tertiary",
        
        // Link
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        default: "h-9 px-4 py-2",
        lg: "h-10 rounded-md px-8",
        xl: "h-11 rounded-md px-10 text-lg",
        icon: "h-9 w-9",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
