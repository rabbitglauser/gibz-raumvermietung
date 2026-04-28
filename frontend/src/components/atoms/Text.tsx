import type { HTMLAttributes, ReactNode } from "react";

type TextTone = "default" | "muted";
type TextSize = "sm" | "base" | "lg";

interface TextProps
  extends Omit<HTMLAttributes<HTMLParagraphElement>, "children"> {
  tone?: TextTone;
  size?: TextSize;
  children: ReactNode;
}

const toneClasses: Record<TextTone, string> = {
  default: "",
  muted: "text-gray-600",
};

const sizeClasses: Record<TextSize, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

export function Text({
  tone = "default",
  size = "base",
  children,
  className,
  ...rest
}: TextProps) {
  const classes = [sizeClasses[size], toneClasses[tone], className]
    .filter(Boolean)
    .join(" ");
  return (
    <p className={classes} {...rest}>
      {children}
    </p>
  );
}
