"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function JobSearchFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("query") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [payType, setPayType] = useState(params.get("payType") ?? "");
  const [urgent, setUrgent] = useState(params.get("urgent") ?? "");

  function apply(e: FormEvent) {
    e.preventDefault();

    const next = new URLSearchParams();
    if (query) next.set("query", query);
    if (category) next.set("category", category);
    if (payType) next.set("payType", payType);
    if (urgent) next.set("urgent", urgent);

    const queryString = next.toString();
    router.push(queryString ? `/jobs?${queryString}` : "/jobs");
  }

  function reset() {
    setQuery("");
    setCategory("");
    setPayType("");
    setUrgent("");
    router.push("/jobs");
  }

  return (
    <form onSubmit={apply} className="surface space-y-3 p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по заданию" className="lg:col-span-2" />

        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Категория</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <Select value={payType} onChange={(event) => setPayType(event.target.value)}>
          <option value="">Оплата</option>
          <option value="PER_HOUR">За час</option>
          <option value="FIXED">Фикс</option>
          <option value="NEGOTIABLE">Договорная</option>
        </Select>
      </div>

      <details className="rounded-lg border bg-background/70 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Доп. фильтры</summary>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Select value={urgent} onChange={(event) => setUrgent(event.target.value)}>
            <option value="">Срочно</option>
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </Select>

          <div className="flex items-center">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Сбросить все
            </Button>
          </div>
        </div>
      </details>

      <Button type="submit" className="w-full sm:w-auto">
        Найти задание
      </Button>
    </form>
  );
}

