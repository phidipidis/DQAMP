import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deped-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80",
        primary:
          "bg-deped-blue text-primary-foreground shadow-sm hover:bg-deped-blue/90 active:bg-deped-blue/80",
        secondary:
          "bg-card text-deped-blue border-2 border-deped-blue shadow-sm hover:bg-muted active:bg-deped-blue-100",
        success:
          "bg-deped-green text-primary-foreground shadow-sm hover:bg-deped-green/90 active:bg-deped-green/80",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "border-2 border-border bg-card text-card-foreground shadow-sm hover:bg-muted active:bg-muted/80",
        ghost:
          "bg-transparent text-deped-blue hover:bg-muted active:bg-deped-blue-100",
        link:
          "text-deped-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className = "", variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}>
      {children}
    </Comp>)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }