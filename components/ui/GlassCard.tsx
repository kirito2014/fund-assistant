import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "light" | "blue" | "dark";
}

export function GlassCard({
  children,
  className = "",
  variant = "default",
  ...props
}: GlassCardProps) {
  let variantClass = "glass-card"; // Default darker glass
  if (variant === "light") variantClass = "glass-card-light";
  if (variant === "blue") variantClass = "glass-blue";
  // "dark" maps to default for now, or we can customize

  return (
    <div className={`${variantClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
