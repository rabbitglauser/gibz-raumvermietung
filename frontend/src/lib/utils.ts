import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assetPath(p: string): string {
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
}
