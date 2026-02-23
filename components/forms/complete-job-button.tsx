"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CompleteJobButton({ jobPostId }: { jobPostId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function completeJob() {
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/jobs/${jobPostId}/complete`, {
      method: "POST"
    });

    setLoading(false);

    if (response.ok) {
      setMessage("Задание завершено");
      router.refresh();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось завершить задание");
  }

  return (
    <div>
      <Button type="button" size="sm" variant="outline" disabled={loading} onClick={completeJob}>
        {loading ? "Завершаем..." : "Завершить"}
      </Button>
      {message && <p className="mt-1 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
