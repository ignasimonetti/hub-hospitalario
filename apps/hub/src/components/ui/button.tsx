import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#0075de] text-white hover:bg-[#005bab] shadow-xs rounded-full font-semibold",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md",
        outline:
          "border border-[#e6e6e6] dark:border-[#383838] bg-white dark:bg-[#242424] text-[#31302e] dark:text-[#f0f0f0] hover:bg-[#f6f5f4] dark:hover:bg-[#2a2a2a] rounded-md",
        secondary:
          "bg-[#f6f5f4] dark:bg-[#2a2a2a] text-[#31302e] dark:text-[#f0f0f0] hover:bg-[#eae8e6] dark:hover:bg-[#333333] rounded-md",
        ghost: "hover:bg-[#f6f5f4] dark:hover:bg-[#2a2a2a] text-[#615d59] dark:text-[#a0a0a0] hover:text-[#000000] dark:hover:text-white rounded-md",
        link: "text-[#0075de] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-md",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-full px-6 text-sm",
        icon: "h-8 w-8 rounded-md",
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
