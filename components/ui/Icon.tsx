import React from "react";

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  className?: string;
  filled?: boolean;
}

export function Icon({ name, className = "", filled = false, ...props }: IconProps) {
  // Material Symbols Outlined font supports 'FILL' axis.
  // We can control fill via font-variation-settings or class if we had specific classes.
  // Standard Google Fonts implementation often uses 'material-symbols-outlined' class.
  // To support fill, we might need inline style or a specific class.
  // For simplicity, we assume the class handles it or we pass a specific style.
  
  const style = filled ? { fontVariationSettings: "'FILL' 1" } : {};

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={style}
      {...props}
    >
      {name}
    </span>
  );
}
