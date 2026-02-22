import { cn } from "@/lib/utils";

export function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={cn("text-sm font-medium", className)}>{children}</label>;
}

