import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "secondary" | "ghost";
}

export function Loading({
  className,
  size = "md",
  variant = "default",
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "md",
          "h-8 w-8": size === "lg",
          "text-foreground": variant === "default",
          "text-primary": variant === "primary",
          "text-secondary": variant === "secondary",
          "text-muted-foreground": variant === "ghost",
        },
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function LoadingIndicator({
  className,
  text = "Loading...",
}: {
  className?: string;
  text?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loading size="sm" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
} 