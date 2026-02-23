"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusAlert } from "@/components/ui/status-alert";
import { extractApiErrorMessage } from "@/lib/api-response";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function markAllRead() {
    if (loading) return;
    setLoading(true);
    setError("");

    const response = await fetch("/api/notifications/read-all", {
      method: "POST"
    });

    setLoading(false);
    if (response.ok) {
      router.refresh();
      return;
    }

    const payload = await response.json().catch(() => null);
    setError(extractApiErrorMessage(payload, "Не удалось обновить уведомления"));
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={markAllRead} disabled={loading}>
        {loading ? "Обновляем..." : "Прочитать все"}
      </Button>
      {error && <StatusAlert message={error} tone="error" className="text-xs" />}
    </div>
  );
}

