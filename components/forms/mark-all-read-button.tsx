"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAllRead() {
    if (loading) return;
    setLoading(true);

    const response = await fetch("/api/notifications/read-all", {
      method: "POST"
    });

    setLoading(false);
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={markAllRead} disabled={loading}>
      {loading ? "Обновляем..." : "Прочитать все"}
    </Button>
  );
}
