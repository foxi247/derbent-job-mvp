"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type TariffOption = {
  id: string;
  name: string;
  durationDays: number;
  kind: "BASIC" | "PREMIUM" | "GOLD";
  effectivePriceRub?: number;
  priceRub?: number;
};

type PromotionButtonProps = {
  endpoint: string;
  tariffs: TariffOption[];
  className?: string;
};

export function PromotionButton({ endpoint, tariffs, className }: PromotionButtonProps) {
  const router = useRouter();
  const defaultTariffId = useMemo(() => tariffs[0]?.id ?? "", [tariffs]);
  const [selectedTariffId, setSelectedTariffId] = useState(defaultTariffId);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function promote() {
    if (!selectedTariffId) {
      setMessage("Выберите тариф");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tariffPlanId: selectedTariffId })
    });

    setLoading(false);
    if (response.ok) {
      setMessage("Публикация продлена");
      router.refresh();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось продлить размещение");
  }

  return (
    <div className={className}>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={selectedTariffId} onChange={(event) => setSelectedTariffId(event.target.value)}>
          {tariffs.map((tariff) => {
            const price = tariff.effectivePriceRub ?? tariff.priceRub ?? 0;
            return (
              <option key={tariff.id} value={tariff.id}>
                {tariff.name} ({price} ₽ / {tariff.durationDays} дн.)
              </option>
            );
          })}
        </Select>

        <Button type="button" size="sm" variant="outline" disabled={loading || !selectedTariffId} onClick={promote}>
          {loading ? "Продлеваем..." : "Продлить"}
        </Button>
      </div>

      {message && <p className="mt-1 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
