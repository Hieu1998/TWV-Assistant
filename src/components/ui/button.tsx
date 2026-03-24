import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600": variant === "default",
            "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-100": variant === "outline",
            "bg-rose-100 text-rose-900 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:hover:bg-rose-900/50": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground dark:hover:bg-zinc-800 dark:hover:text-zinc-100": variant === "ghost",
            "text-primary underline-offset-4 hover:underline dark:text-zinc-100": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
