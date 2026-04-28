import type { HTMLAttributes, ReactNode } from "react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingProps
  extends Omit<HTMLAttributes<HTMLHeadingElement>, "children"> {
  level: HeadingLevel;
  children: ReactNode;
}

const levelClasses: Record<HeadingLevel, string> = {
  1: "text-4xl font-bold",
  2: "text-xl font-semibold",
  3: "text-lg font-semibold",
  4: "text-base font-semibold",
  5: "text-sm font-semibold",
  6: "text-xs font-semibold uppercase tracking-wide",
};

export function Heading({
  level,
  children,
  className,
  ...rest
}: HeadingProps) {
  const Tag = `h${level}` as const;
  const classes = [levelClasses[level], className].filter(Boolean).join(" ");
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
