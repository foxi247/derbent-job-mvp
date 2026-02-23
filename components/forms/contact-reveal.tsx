"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ContactRevealProps = {
  maskedPhone: string;
  listingId?: string;
  jobPostId?: string;
  hasPhone: boolean;
};

export function ContactReveal({ maskedPhone, listingId, jobPostId, hasPhone }: ContactRevealProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function reveal() {
    if (!hasPhone || isLoading) {
      return;
    }

    setIsLoading(true);
    setStatus("");

    const response = await fetch("/api/contacts/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, jobPostId })
    });

    setIsLoading(false);

    if (response.ok) {
      const data = await response.json();
      setPhone(data.phone);
      return;
    }

    if (response.status === 401) {
      setStatus("Войдите в аккаунт, чтобы открыть номер.");
      return;
    }

    const payload = await response.json().catch(() => null);
    setStatus(payload?.error ?? "Не удалось открыть номер.");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">
        <span className="text-muted-foreground">Телефон:</span> {phone ?? maskedPhone}
      </p>
      <Button type="button" variant="outline" size="sm" disabled={!hasPhone || isLoading || Boolean(phone)} onClick={reveal}>
        {phone ? "Номер открыт" : isLoading ? "Открываем..." : "Показать номер"}
      </Button>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
