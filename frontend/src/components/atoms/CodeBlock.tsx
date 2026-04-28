import type { HTMLAttributes, ReactNode } from "react";

interface CodeBlockProps
  extends Omit<HTMLAttributes<HTMLPreElement>, "children"> {
  children: ReactNode;
}

export function CodeBlock({ children, className, ...rest }: CodeBlockProps) {
  const classes = [
    "rounded bg-gray-100 p-4 text-sm font-mono",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <pre className={classes} {...rest}>
      {children}
    </pre>
  );
}
