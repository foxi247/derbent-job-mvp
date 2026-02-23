"use client";

import { cn } from "@/lib/utils";

type StatusAlertProps = {
  message: string;
  tone?: "info" | "success" | "error";
  className?: string;
};

const toneClasses: Record<NonNullable<StatusAlertProps["tone"]>, string> = {
  info: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-red-200 bg-red-50 text-red-700"
};

export function StatusAlert({ message, tone = "info", className }: StatusAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className={cn("rounded-lg border px-3 py-2 text-sm", toneClasses[tone], className)}>
      {message}
    </p>
  );
}

