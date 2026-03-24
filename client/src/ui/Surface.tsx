import React from "react";
import "./ui.css";
import { cn } from "./cn";

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "soft" | "card";
  padding?: "base" | "tight" | "loose";
  className?: string;
  children: React.ReactNode;
}

export function Surface({
  variant = "default",
  padding = "base",
  className,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <div
      className={cn(
        "surface",
        variant === "glass" && "surface--glass",
        variant === "soft" && "surface--soft",
        padding === "tight" && "surface--tight",
        padding === "loose" && "surface--loose",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
