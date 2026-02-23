"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RoleSelector({ currentRole }: { currentRole: "EXECUTOR" | "EMPLOYER" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function setRole(role: "EXECUTOR" | "EMPLOYER") {
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
    }
  }

  return (
    <div className="space-y-3">
      <Button
        disabled={pending}
        className="w-full"
        variant={currentRole === "EXECUTOR" ? "default" : "outline"}
        onClick={() => setRole("EXECUTOR")}
      >
        Я исполнитель
      </Button>
      <Button
        disabled={pending}
        className="w-full"
        variant={currentRole === "EMPLOYER" ? "default" : "outline"}
        onClick={() => setRole("EMPLOYER")}
      >
        Я работодатель
      </Button>
    </div>
  );
}
