"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FavoriteToggleProps = {
  targetType: "LISTING" | "JOB";
  listingId?: string;
  jobPostId?: string;
  initialActive?: boolean;
  className?: string;
};

export function FavoriteToggle({
  targetType,
  listingId,
  jobPostId,
  initialActive = false,
  className
}: FavoriteToggleProps) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    const payload = {
      targetType,
      listingId: listingId ?? undefined,
      jobPostId: jobPostId ?? undefined
    };

    const response = await fetch("/api/favorites", {
      method: active ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (response.ok) {
      setActive((prev) => !prev);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={loading}
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      className={cn("h-8 w-8 rounded-full p-0", className)}
    >
      <Heart className={cn("h-4 w-4", active ? "fill-rose-500 text-rose-500" : "text-muted-foreground")} />
    </Button>
  );
}
