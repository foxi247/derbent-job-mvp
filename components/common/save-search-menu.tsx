"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SaveSearchMenuProps = {
  type: "LISTING" | "JOB";
  queryParams: Record<string, string | undefined>;
};

export function SaveSearchMenu({ type, queryParams }: SaveSearchMenuProps) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const sanitized = useMemo(() => {
    const entries = Object.entries(queryParams).filter(([, value]) => typeof value === "string" && value.trim().length > 0);
    return Object.fromEntries(entries) as Record<string, string>;
  }, [queryParams]);

  async function saveSearch() {
    if (saving) return;
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        queryParams: sanitized
      })
    });

    setSaving(false);
    if (response.ok) {
      setMessage("Поиск сохранен");
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось сохранить поиск");
  }

  return (
    <details className="relative">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full border bg-white text-sm">
        ⋯
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-52 space-y-2 rounded-xl border bg-white p-2 shadow-lg">
        <Button type="button" size="sm" variant="outline" onClick={saveSearch} disabled={saving} className="w-full justify-start">
          {saving ? "Сохраняем..." : "Сохранить поиск"}
        </Button>
        <Button asChild type="button" size="sm" variant="ghost" className="w-full justify-start">
          <Link href="/saved-searches">Мои поиски</Link>
        </Button>
        {message && <p className="px-1 text-xs text-muted-foreground">{message}</p>}
      </div>
    </details>
  );
}
