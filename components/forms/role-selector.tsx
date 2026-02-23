"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { extractApiErrorMessage } from "@/lib/api-response";
import { Button } from "@/components/ui/button";
import { StatusAlert } from "@/components/ui/status-alert";

export function RoleSelector({ currentRole }: { currentRole: "EXECUTOR" | "EMPLOYER" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function setRole(role: "EXECUTOR" | "EMPLOYER") {
    setError("");
    const response = await fetch("/api/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });

    if (response.ok) {
      startTransition(() => {
        router.push(role === "EXECUTOR" ? "/dashboard" : "/dashboard-employer");
        router.refresh();
      });
      return;
    }

    const payload = await response.json().catch(() => null);
    setError(extractApiErrorMessage(payload, "Не удалось изменить роль"));
  }

  return (
    <div className="space-y-3">
      <Button
        disabled={pending}
        className="h-11 w-full"
        variant={currentRole === "EXECUTOR" ? "default" : "outline"}
        onClick={() => setRole("EXECUTOR")}
      >
        Я исполнитель
      </Button>
      <Button
        disabled={pending}
        className="h-11 w-full"
        variant={currentRole === "EMPLOYER" ? "default" : "outline"}
        onClick={() => setRole("EMPLOYER")}
      >
        Я работодатель
      </Button>
      {error && <StatusAlert message={error} tone="error" />}
    </div>
  );
}

