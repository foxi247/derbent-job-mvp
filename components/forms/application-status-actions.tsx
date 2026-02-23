"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusAlert } from "@/components/ui/status-alert";
import { extractApiErrorMessage } from "@/lib/api-response";

type ApplicationStatusActionsProps = {
  applicationId: string;
};

export function ApplicationStatusActions({ applicationId }: ApplicationStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function updateStatus(status: "ACCEPTED" | "REJECTED") {
    if (loading) return;
    setLoading(true);
    setMessage("");
    setIsError(false);

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
    setIsError(true);
    setMessage(extractApiErrorMessage(payload, "Не удалось обновить статус"));
  }

  return (
    <div className="space-y-1">
      <details className="relative">
        <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border bg-white text-sm">
          ...
        </summary>
        <div className="absolute right-0 z-40 mt-2 w-44 space-y-1 rounded-xl border bg-white p-2 shadow-lg">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full justify-start"
            disabled={loading}
            onClick={() => void updateStatus("ACCEPTED")}
          >
            Принять
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full justify-start"
            disabled={loading}
            onClick={() => void updateStatus("REJECTED")}
          >
            Отклонить
          </Button>
        </div>
      </details>
      {message && <StatusAlert message={message} tone={isError ? "error" : "success"} className="text-xs" />}
    </div>
  );
}

