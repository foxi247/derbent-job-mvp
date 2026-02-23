"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteSavedSearchButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (loading) return;
    setLoading(true);

    const response = await fetch(`/api/saved-searches/${id}`, {
      method: "DELETE"
    });

    setLoading(false);
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={loading}>
      {loading ? "Удаляем..." : "Удалить"}
    </Button>
  );
}
