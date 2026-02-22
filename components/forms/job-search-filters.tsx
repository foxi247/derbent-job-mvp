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

    router.push(`/jobs?${next.toString()}`);
  }

  function reset() {
    setQuery("");
    setCategory("");
    setPayType("");
    setUrgent("");
    router.push("/jobs");
  }

  return (
    <form onSubmit={apply} className="surface grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-6">
      <div className="md:col-span-3 xl:col-span-6">
        <p className="text-sm font-medium">Фильтры заданий</p>
        <p className="text-xs text-muted-foreground">Показываются только активные задания по Дербенту.</p>
      </div>

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по названию и описанию" className="xl:col-span-2" />

      <Select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Категория</option>
        {categories.map((categoryItem) => (
          <option key={categoryItem} value={categoryItem}>
            {categoryItem}
          </option>
        ))}
      </Select>

      <Select value={payType} onChange={(e) => setPayType(e.target.value)}>
        <option value="">Оплата</option>
        <option value="PER_HOUR">За час</option>
        <option value="FIXED">Фикс</option>
        <option value="NEGOTIABLE">Договорная</option>
      </Select>

      <Select value={urgent} onChange={(e) => setUrgent(e.target.value)}>
        <option value="">Срочно</option>
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </Select>

      <Button type="submit" className="w-full">
        Применить
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={reset}>
        Сбросить
      </Button>
    </form>
  );
}
