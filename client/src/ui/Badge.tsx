import React from "react";
import "./ui.css";
import { cn } from "./cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "warning";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ 
  variant = "default", 
  className, 
  children, 
  ...rest 
}: BadgeProps) {
  return (
    <span
      className={cn(
        "ui-badge",
        variant === "accent" && "ui-badge--accent",
        variant === "success" && "ui-badge--success",
        variant === "warning" && "ui-badge--warning",
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
