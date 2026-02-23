"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PayType = "PER_HOUR" | "FIXED" | "NEGOTIABLE";
type JobPostStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

type TariffOption = {
  id: string;
  name: string;
  durationDays: number;
  kind: "BASIC" | "PREMIUM" | "GOLD";
  priceRub: number;
  discountPercent: number;
};

type JobFormProps = {
  jobPost?: {
    id: string;
    title: string;
    category: string;
    description: string;
    payType: PayType;
    payValue: unknown;
    district: string | null;
    phone: string | null;
    urgentToday: boolean;
    status: JobPostStatus;
  };
  compact?: boolean;
  tariffs: TariffOption[];
};

function calculateEffectivePrice(priceRub: number, discountPercent: number) {
  return Math.max(0, Math.floor((priceRub * (100 - discountPercent)) / 100));
}

export function JobForm({ jobPost, compact = false, tariffs }: JobFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(jobPost?.title ?? "");
  const [category, setCategory] = useState(jobPost?.category ?? "");
  const [description, setDescription] = useState(jobPost?.description ?? "");
  const [payType, setPayType] = useState<PayType>(jobPost?.payType ?? "NEGOTIABLE");
  const [payValue, setPayValue] = useState(jobPost?.payValue != null ? String(jobPost.payValue) : "");
  const [district, setDistrict] = useState(jobPost?.district ?? "");
  const [phone, setPhone] = useState(jobPost?.phone ?? "");
  const [urgentToday, setUrgentToday] = useState(jobPost?.urgentToday ?? false);
  const [status, setStatus] = useState<JobPostStatus>(jobPost?.status ?? "ACTIVE");
  const [tariffPlanId, setTariffPlanId] = useState(tariffs[0]?.id ?? "");
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedTariff = useMemo(() => tariffs.find((item) => item.id === tariffPlanId) ?? null, [tariffs, tariffPlanId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setResult("");
    setIsSaving(true);

    let parsedPay: number | null = null;
    if (payType !== "NEGOTIABLE") {
      if (!payValue.trim()) {
        setResult("Укажите оплату или выберите «Договорная».");
        setIsSaving(false);
        return;
      }

      const numericPay = Number(payValue.replace(",", "."));
      if (!Number.isFinite(numericPay) || numericPay < 0) {
        setResult("Оплата должна быть числом от 0.");
        setIsSaving(false);
        return;
      }

      parsedPay = numericPay;
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
      payType,
      payValue: parsedPay,
      district: district || null,
      phone: phone || null,
      urgentToday,
      status,
      tariffPlanId: status === "ACTIVE" ? tariffPlanId : null
    };

    const endpoint = jobPost ? `/api/jobs/${jobPost.id}` : "/api/jobs";
    const method = jobPost ? "PATCH" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsSaving(false);
    if (response.ok) {
      setResult(jobPost ? "Изменения сохранены" : "Задание опубликовано");
      if (!jobPost) {
        setTitle("");
        setCategory("");
        setDescription("");
        setPayType("NEGOTIABLE");
        setPayValue("");
        setDistrict("");
        setPhone("");
        setUrgentToday(false);
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
          <h2 className="text-lg font-semibold">Новое задание</h2>
          <p className="text-sm text-muted-foreground">Опишите задачу и выберите тариф публикации.</p>
        </div>
      )}

      <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название задания" required />
      <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Категория" required />
      <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Описание" required />

      <div className="grid gap-2 md:grid-cols-3">
        <Select value={payType} onChange={(event) => setPayType(event.target.value as PayType)}>
          <option value="PER_HOUR">За час</option>
          <option value="FIXED">Фикс</option>
          <option value="NEGOTIABLE">Договорная</option>
        </Select>

        <Input value={payValue} onChange={(event) => setPayValue(event.target.value)} placeholder="Оплата" />
        <Input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Район (опционально)" />
      </div>

      <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Телефон в задании (опционально)" />

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
        <div className="mt-3 grid gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={urgentToday}
              onChange={(event) => setUrgentToday(event.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Срочно закрыть сегодня
          </label>

          <Select value={status} onChange={(event) => setStatus(event.target.value as JobPostStatus)}>
            <option value="ACTIVE">Опубликовать сейчас</option>
            <option value="PAUSED">Сохранить как черновик</option>
            <option value="COMPLETED">Отметить завершенным</option>
          </Select>
        </div>
      </details>

      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Сохраняем..." : jobPost ? "Сохранить" : "Опубликовать"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
