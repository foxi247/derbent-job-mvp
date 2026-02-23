"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ExecutorOption = {
  id: string;
  name: string;
};

type ReviewFormProps = {
  jobPostId: string;
  executors: ExecutorOption[];
};

export function ReviewForm({ jobPostId, executors }: ReviewFormProps) {
  const [executorUserId, setExecutorUserId] = useState(executors[0]?.id ?? "");
  const [rating, setRating] = useState("5");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!executorUserId) {
      setResult("Выберите исполнителя");
      return;
    }

    setIsSaving(true);
    setResult("");

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobPostId,
        executorUserId,
        rating: Number(rating),
        text: text.trim() ? text.trim() : null
      })
    });

    setIsSaving(false);
    if (response.ok) {
      setText("");
      setResult("Отзыв сохранен");
      return;
    }

    const payload = await response.json().catch(() => null);
    setResult(payload?.error ?? "Не удалось сохранить отзыв");
  }

  return (
    <form onSubmit={submit} className="surface space-y-2 p-4">
      <h3 className="font-medium">Оставить отзыв</h3>

      <Select value={executorUserId} onChange={(event) => setExecutorUserId(event.target.value)} required>
        {executors.length === 0 && <option value="">Нет исполнителей</option>}
        {executors.map((executor) => (
          <option key={executor.id} value={executor.id}>
            {executor.name}
          </option>
        ))}
      </Select>

      <Select value={rating} onChange={(event) => setRating(event.target.value)}>
        <option value="5">5 - Отлично</option>
        <option value="4">4 - Хорошо</option>
        <option value="3">3 - Нормально</option>
        <option value="2">2 - Слабо</option>
        <option value="1">1 - Плохо</option>
      </Select>

      <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Комментарий (опционально)" />

      <Button type="submit" disabled={isSaving || executors.length === 0}>
        {isSaving ? "Сохраняем..." : "Оставить отзыв"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
