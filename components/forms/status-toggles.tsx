"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

async function patchStatus(payload: { isOnline?: boolean; urgentToday?: boolean }) {
  await fetch("/api/profile/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function StatusToggles({ isOnline, urgentToday }: { isOnline: boolean; urgentToday: boolean }) {
  const [onlineState, setOnlineState] = useState(isOnline);
  const [urgentState, setUrgentState] = useState(urgentToday);

  return (
    <div className="surface grid gap-4 p-4 md:grid-cols-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">В сети</p>
          <p className="text-xs text-muted-foreground">Ручной переключатель активности</p>
        </div>
        <Switch
          checked={onlineState}
          onCheckedChange={(value) => {
            setOnlineState(value);
            void patchStatus({ isOnline: value });
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Срочно / готов сегодня</p>
          <p className="text-xs text-muted-foreground">Отображается в карточке объявления</p>
        </div>
        <Switch
          checked={urgentState}
          onCheckedChange={(value) => {
            setUrgentState(value);
            void patchStatus({ urgentToday: value });
          }}
        />
      </div>
    </div>
  );
}