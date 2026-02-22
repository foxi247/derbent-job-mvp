"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PriceType = "PER_SQM" | "PER_HOUR" | "FIXED" | "NEGOTIABLE";
type ListingStatus = "ACTIVE" | "PAUSED";

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
  initialExperienceYears?: number;
};

const EXPERIENCE_PRESETS = [0, 1, 2, 3, 5, 7, 10];

export function ListingForm({ listing, compact = false, initialExperienceYears = 0 }: ListingFormProps) {
  const [title, setTitle] = useState(listing?.title ?? "");
  const [category, setCategory] = useState(listing?.category ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [priceType, setPriceType] = useState<PriceType>(listing?.priceType ?? "NEGOTIABLE");
  const [priceValue, setPriceValue] = useState(listing?.priceValue != null ? String(listing.priceValue) : "");
  const [district, setDistrict] = useState(listing?.district ?? "");
  const [status, setStatus] = useState<ListingStatus>(listing?.status ?? "ACTIVE");
  const [experienceYears, setExperienceYears] = useState(String(initialExperienceYears));
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const normalizedExperienceYears = useMemo(() => {
    const value = Number(experienceYears);
    if (!Number.isFinite(value) || value < 0) return 0;
    return Math.min(60, Math.trunc(value));
  }, [experienceYears]);

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

    if (!compact) {
      const profileResult = await fetch("/api/profile/experience", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceYears: normalizedExperienceYears })
      });

      if (!profileResult.ok) {
        setResult("Не удалось сохранить стаж исполнителя.");
        setIsSaving(false);
        return;
      }
    }

    const payload = {
      title,
      category,
      description,
      priceType,
      priceValue: parsedPrice,
      district: district || null,
      status
    };

    const endpoint = listing ? `/api/listings/${listing.id}` : "/api/listings";
    const method = listing ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setResult(listing ? "Изменения сохранены" : "Объявление создано");
      if (!listing) {
        setTitle("");
        setCategory("");
        setDescription("");
        setPriceType("NEGOTIABLE");
        setPriceValue("");
        setDistrict("");
      }
    } else {
      setResult("Ошибка сохранения");
    }

    setIsSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="surface space-y-3 p-4">
      {!compact && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Объявление исполнителя</h2>
          <p className="text-xs text-muted-foreground">
            Профиль, навыки и доступность можно детально настроить в{" "}
            <Link href="/profile" className="underline">
              профиле
            </Link>
            .
          </p>
        </div>
      )}

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Курьер по Дербенту" required />
      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" required />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Кратко опишите опыт и что делаете" required />

      {!compact && (
        <div className="grid gap-2 md:grid-cols-2">
          <Select value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}>
            <option value="0">Стаж: 0 лет</option>
            {EXPERIENCE_PRESETS.filter((v) => v > 0).map((v) => (
              <option key={v} value={String(v)}>
                Стаж: {v} {v === 1 ? "год" : v < 5 ? "года" : "лет"}
              </option>
            ))}
            {normalizedExperienceYears > 10 && <option value={String(normalizedExperienceYears)}>Стаж: {normalizedExperienceYears} лет</option>}
          </Select>

          <Input
            type="number"
            min={0}
            max={60}
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            placeholder="Или введите стаж вручную"
            required
          />
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        <Select value={priceType} onChange={(e) => setPriceType(e.target.value as PriceType)}>
          <option value="PER_SQM">За м2</option>
          <option value="PER_HOUR">За час</option>
          <option value="FIXED">Фикс</option>
          <option value="NEGOTIABLE">Договорная</option>
        </Select>
        <Input value={priceValue} onChange={(e) => setPriceValue(e.target.value)} placeholder="Цена (если не договорная)" />
        <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Район (опционально)" />
      </div>

      <Select value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)}>
        <option value="ACTIVE">Активно</option>
        <option value="PAUSED">На паузе</option>
      </Select>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Сохраняем..." : listing ? "Обновить" : "Создать"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
