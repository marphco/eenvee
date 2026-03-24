import React from "react";
import "./ui.css";
import { cn } from "./cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "subtle" | "ghost" | "danger" | "outline" | "ghost-white";
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "ui-button",
        variant === "subtle" && "ui-button--subtle",
        variant === "ghost" && "ui-button--ghost",
        variant === "danger" && "ui-button--danger",
        variant === "outline" && "ui-button--outline",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
