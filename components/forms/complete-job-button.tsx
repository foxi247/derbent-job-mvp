"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { extractApiErrorMessage } from "@/lib/api-response";
import { Button } from "@/components/ui/button";
import { StatusAlert } from "@/components/ui/status-alert";

export function CompleteJobButton({ jobPostId }: { jobPostId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function completeJob() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    setIsError(false);

    const response = await fetch(`/api/jobs/${jobPostId}/complete`, {
      method: "POST"
    });

    setLoading(false);

    if (response.ok) {
      setMessage("Задание завершено");
      setIsError(false);
      router.refresh();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(extractApiErrorMessage(payload, "Не удалось завершить задание"));
    setIsError(true);
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="sm" variant="outline" disabled={loading} onClick={completeJob}>
        {loading ? "Завершаем..." : "Завершить"}
      </Button>
      {message && <StatusAlert message={message} tone={isError ? "error" : "success"} className="text-xs" />}
    </div>
  );
}

