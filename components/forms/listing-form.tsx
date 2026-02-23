"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PriceType = "PER_SQM" | "PER_HOUR" | "FIXED" | "NEGOTIABLE";
type ListingStatus = "ACTIVE" | "PAUSED";

type TariffOption = {
  id: string;
  name: string;
  durationDays: number;
  kind: "BASIC" | "PREMIUM" | "GOLD";
  priceRub: number;
  discountPercent: number;
};

type ListingFormProps = {
  listing?: {
    id: string;
    title: string;
    category: string;
    description: string;
    priceType: PriceType;
    priceValue: unknown;
    district: string | null;
    status: ListingStatus;
  };
  compact?: boolean;
  tariffs: TariffOption[];
};

function calculateEffectivePrice(priceRub: number, discountPercent: number) {
  return Math.max(0, Math.floor((priceRub * (100 - discountPercent)) / 100));
}

export function ListingForm({ listing, compact = false, tariffs }: ListingFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(listing?.title ?? "");
  const [category, setCategory] = useState(listing?.category ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [priceType, setPriceType] = useState<PriceType>(listing?.priceType ?? "NEGOTIABLE");
  const [priceValue, setPriceValue] = useState(listing?.priceValue != null ? String(listing.priceValue) : "");
  const [district, setDistrict] = useState(listing?.district ?? "");
  const [status, setStatus] = useState<ListingStatus>(listing?.status ?? "ACTIVE");
  const [tariffPlanId, setTariffPlanId] = useState(tariffs[0]?.id ?? "");
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedTariff = useMemo(() => tariffs.find((item) => item.id === tariffPlanId) ?? null, [tariffs, tariffPlanId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setResult("");
    setIsSaving(true);

    let parsedPrice: number | null = null;
    if (priceType !== "NEGOTIABLE") {
      if (!priceValue.trim()) {
        setResult("Укажите цену или выберите тип «Договорная».");
        setIsSaving(false);
        return;
      }

      const numericPrice = Number(priceValue.replace(",", "."));
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        setResult("Цена должна быть числом от 0.");
        setIsSaving(false);
        return;
      }

      parsedPrice = numericPrice;
    }

    if (status === "ACTIVE" && !tariffPlanId) {
      setResult("Выберите тариф для публикации.");
      setIsSaving(false);
      return;
    }

    const payload = {
      title,
      category,
      description,
      priceType,
      priceValue: parsedPrice,
      district: district || null,
      status,
      tariffPlanId: status === "ACTIVE" ? tariffPlanId : null
    };

    const endpoint = listing ? `/api/listings/${listing.id}` : "/api/listings";
    const method = listing ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsSaving(false);

    if (response.ok) {
      setResult(listing ? "Изменения сохранены" : "Анкета опубликована");
      if (!listing) {
        setTitle("");
        setCategory("");
        setDescription("");
        setPriceType("NEGOTIABLE");
        setPriceValue("");
        setDistrict("");
        setStatus("ACTIVE");
      }
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => null);
    setResult(data?.error ?? "Ошибка сохранения");
  }

  return (
    <form onSubmit={onSubmit} className="surface space-y-3 p-4 md:p-5">
      {!compact && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Анкета исполнителя</h2>
          <p className="text-sm text-muted-foreground">Заполните данные и опубликуйте анкету по выбранному тарифу.</p>
        </div>
      )}

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Кем хотите работать" required />
      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" required />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Кратко о себе" required />

      <div className="grid gap-2 md:grid-cols-3">
        <Select value={priceType} onChange={(e) => setPriceType(e.target.value as PriceType)}>
          <option value="PER_SQM">За м2</option>
          <option value="PER_HOUR">За час</option>
          <option value="FIXED">Фикс</option>
          <option value="NEGOTIABLE">Договорная</option>
        </Select>

        <Input value={priceValue} onChange={(e) => setPriceValue(e.target.value)} placeholder="Цена" />
        <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Район (опционально)" />
      </div>

      <div className="space-y-2 rounded-xl border bg-background/70 p-3">
        <p className="text-sm font-medium">Тариф публикации</p>
        <Select value={tariffPlanId} onChange={(event) => setTariffPlanId(event.target.value)}>
          {tariffs.map((tariff) => {
            const effectivePrice = calculateEffectivePrice(tariff.priceRub, tariff.discountPercent);
            return (
              <option key={tariff.id} value={tariff.id}>
                {tariff.name} ({effectivePrice} ₽ / {tariff.durationDays} дн.)
              </option>
            );
          })}
        </Select>
        {selectedTariff && (
          <p className="text-xs text-muted-foreground">
            Будет списано: {calculateEffectivePrice(selectedTariff.priceRub, selectedTariff.discountPercent)} ₽
          </p>
        )}
      </div>

      <details className="rounded-lg border bg-background/70 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Дополнительно</summary>
        <div className="mt-3 space-y-2">
          <Select value={status} onChange={(event) => setStatus(event.target.value as ListingStatus)}>
            <option value="ACTIVE">Опубликовать сейчас</option>
            <option value="PAUSED">Сохранить как черновик</option>
          </Select>
        </div>
      </details>

      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Сохраняем..." : listing ? "Сохранить" : "Опубликовать"}
      </Button>

      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
