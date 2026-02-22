"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type PromotionButtonProps = {
  endpoint: string;
  className?: string;
};

export function PromotionButton({ endpoint, className }: PromotionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function promote() {
    setLoading(true);
    setMessage("");

    const response = await fetch(endpoint, { method: "POST" });

    setLoading(false);
    if (response.ok) {
      setMessage("Продлено на 7 дней (demo)");
      router.refresh();
      return;
    }

    setMessage("Не удалось продлить размещение");
  }

  return (
    <div className={className}>
      <Button type="button" size="sm" variant="outline" disabled={loading} onClick={promote}>
        {loading ? "Продлеваем..." : "Продлить на 7 дней (200₽)"}
      </Button>
      {message && <p className="mt-1 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
