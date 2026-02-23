"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { StatusAlert } from "@/components/ui/status-alert";

async function patchStatus(payload: { isOnline?: boolean; urgentToday?: boolean }) {
  const response = await fetch("/api/profile/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Не удалось обновить статус");
  }
}

export function StatusToggles({ isOnline, urgentToday }: { isOnline: boolean; urgentToday: boolean }) {
  const [onlineState, setOnlineState] = useState(isOnline);
  const [urgentState, setUrgentState] = useState(urgentToday);
  const [error, setError] = useState("");

  return (
    <details className="surface p-4">
      <summary className="cursor-pointer text-sm font-medium">Статусы анкеты</summary>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">В сети</p>
            <p className="text-xs text-muted-foreground">Ручной переключатель активности</p>
          </div>
          <Switch
            checked={onlineState}
            onCheckedChange={(value) => {
              setOnlineState(value);
              setError("");
              void patchStatus({ isOnline: value }).catch((e) => {
                setOnlineState((prev) => !prev);
                setError(e instanceof Error ? e.message : "Не удалось обновить статус");
              });
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Срочно / готов сегодня</p>
            <p className="text-xs text-muted-foreground">Показывается в карточке</p>
          </div>
          <Switch
            checked={urgentState}
            onCheckedChange={(value) => {
              setUrgentState(value);
              setError("");
              void patchStatus({ urgentToday: value }).catch((e) => {
                setUrgentState((prev) => !prev);
                setError(e instanceof Error ? e.message : "Не удалось обновить статус");
              });
            }}
          />
        </div>
      </div>
      {error && <StatusAlert message={error} tone="error" className="mt-3 text-xs" />}
    </details>
  );
}

