import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase tracking-wider font-heading",
  {
    variants: {
      variant: {
        default:
          "border-primary/50 bg-primary/10 text-primary hud-glow-box",
        secondary:
          "border-secondary-border bg-secondary/50 text-secondary-foreground",
        destructive:
          "border-destructive/50 bg-destructive/10 text-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]",
        outline: "text-foreground border-primary/30",
        s: "rank-s",
        a: "rank-a",
        b: "rank-b",
        c: "rank-c",
        d: "rank-d",
        e: "rank-e",
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