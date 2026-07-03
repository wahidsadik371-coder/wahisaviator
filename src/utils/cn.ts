// Tiny class-merge helper combining clsx + tailwind-merge.
//
// Currently unused — the components in this project compose class strings
// directly with template literals. Kept here so future components can opt
// into cleaner conditional-class syntax without re-adding the dependency.
//
// Usage:
//   import { cn } from "@/utils/cn";
//   <button className={cn("base", isActive && "active", className)} />

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
