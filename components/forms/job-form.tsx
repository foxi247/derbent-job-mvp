"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PayType = "PER_HOUR" | "FIXED" | "NEGOTIABLE";
type JobPostStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

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
};

export function JobForm({ jobPost, compact = false }: JobFormProps) {
  const [title, setTitle] = useState(jobPost?.title ?? "");
  const [category, setCategory] = useState(jobPost?.category ?? "");
  const [description, setDescription] = useState(jobPost?.description ?? "");
  const [payType, setPayType] = useState<PayType>(jobPost?.payType ?? "NEGOTIABLE");
  const [payValue, setPayValue] = useState(jobPost?.payValue != null ? String(jobPost.payValue) : "");
  const [district, setDistrict] = useState(jobPost?.district ?? "");
  const [phone, setPhone] = useState(jobPost?.phone ?? "");
  const [urgentToday, setUrgentToday] = useState(jobPost?.urgentToday ?? false);
  const [status, setStatus] = useState<JobPostStatus>(jobPost?.status ?? "ACTIVE");
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setResult("");
    setIsSaving(true);

    let parsedPay: number | null = null;
    if (payType !== "NEGOTIABLE") {
      if (!payValue.trim()) {
        setResult("Укажите оплату или выберите тип «Договорная».");
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

    const payload = {
      title,
      category,
      description,
      payType,
      payValue: parsedPay,
      district: district || null,
      phone: phone || null,
      urgentToday,
      status
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
      setResult(jobPost ? "Изменения сохранены" : "Задание создано");
      if (!jobPost) {
        setTitle("");
        setCategory("");
        setDescription("");
        setPayType("NEGOTIABLE");
        setPayValue("");
        setDistrict("");
        setPhone("");
        setUrgentToday(false);
      }
    } else {
      setResult("Ошибка сохранения");
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface space-y-3 p-4">
      {!compact && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Задание работодателя</h2>
          <p className="text-xs text-muted-foreground">После создания задание автоматически получает demo-размещение на 7 дней.</p>
        </div>
      )}

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Нужен бариста на вечернюю смену" required />
      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Категория" required />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опишите задачу, условия и ожидания" required />

      <div className="grid gap-2 md:grid-cols-3">
        <Select value={payType} onChange={(e) => setPayType(e.target.value as PayType)}>
          <option value="PER_HOUR">За час</option>
          <option value="FIXED">Фикс</option>
          <option value="NEGOTIABLE">Договорная</option>
        </Select>
        <Input value={payValue} onChange={(e) => setPayValue(e.target.value)} placeholder="Оплата (если не договорная)" />
        <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Район (опционально)" />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон в задании (опционально)" />

        <Select value={status} onChange={(e) => setStatus(e.target.value as JobPostStatus)}>
          <option value="ACTIVE">Активно</option>
          <option value="PAUSED">На паузе</option>
          <option value="COMPLETED">Завершено</option>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={urgentToday}
          onChange={(e) => setUrgentToday(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Срочно закрыть сегодня
      </label>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Сохраняем..." : jobPost ? "Обновить" : "Создать"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
