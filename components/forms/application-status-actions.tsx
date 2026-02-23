"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ApplicationStatusActionsProps = {
  applicationId: string;
};

export function ApplicationStatusActions({ applicationId }: ApplicationStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(status: "ACCEPTED" | "REJECTED") {
    if (loading) return;
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/job-applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    setLoading(false);

    if (response.ok) {
      setMessage(status === "ACCEPTED" ? "Отклик принят" : "Отклик отклонен");
      router.refresh();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось обновить статус");
  }

  return (
    <div className="space-y-1">
      <details className="relative">
        <summary className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-full border bg-white text-sm">
          ⋯
        </summary>
        <div className="absolute right-0 z-40 mt-2 w-44 space-y-1 rounded-xl border bg-white p-2 shadow-lg">
          <Button type="button" size="sm" variant="outline" className="w-full justify-start" disabled={loading} onClick={() => void updateStatus("ACCEPTED")}>
            Принять
          </Button>
          <Button type="button" size="sm" variant="ghost" className="w-full justify-start" disabled={loading} onClick={() => void updateStatus("REJECTED")}>
            Отклонить
          </Button>
        </div>
      </details>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
