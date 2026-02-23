"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function SearchFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const initialExperience = useMemo(() => {
    const min = params.get("experienceMin");
    const max = params.get("experienceMax");
    if (!min) return "";
    return max ? `${min}-${max}` : `${min}-100`;
  }, [params]);

  const [query, setQuery] = useState(params.get("query") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [experience, setExperience] = useState(initialExperience);

  const [priceType, setPriceType] = useState(params.get("priceType") ?? "");
  const [online, setOnline] = useState(params.get("online") ?? "");
  const [urgent, setUrgent] = useState(params.get("urgent") ?? "");

  function apply(e: FormEvent) {
    e.preventDefault();

    const next = new URLSearchParams();
    if (query) next.set("query", query);
    if (category) next.set("category", category);

    if (experience) {
      const [min, max] = experience.split("-");
      next.set("experienceMin", min);
      if (max) next.set("experienceMax", max);
    }

    if (priceType) next.set("priceType", priceType);
    if (online) next.set("online", online);
    if (urgent) next.set("urgent", urgent);

    const queryString = next.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  }

  function reset() {
    setQuery("");
    setCategory("");
    setExperience("");
    setPriceType("");
    setOnline("");
    setUrgent("");
    router.push("/");
  }

  return (
    <form onSubmit={apply} className="surface space-y-3 p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию и описанию"
          className="lg:col-span-2"
        />

        <Select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Категория</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <Select value={experience} onChange={(event) => setExperience(event.target.value)}>
          <option value="">Стаж</option>
          <option value="0-1">0-1 год</option>
          <option value="1-3">1-3 года</option>
          <option value="3-5">3-5 лет</option>
          <option value="5-100">5+ лет</option>
        </Select>
      </div>

      <details className="rounded-lg border bg-background/70 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Доп. фильтры</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Select value={priceType} onChange={(event) => setPriceType(event.target.value)}>
            <option value="">Тип цены</option>
            <option value="PER_SQM">За м2</option>
            <option value="PER_HOUR">За час</option>
            <option value="FIXED">Фикс</option>
            <option value="NEGOTIABLE">Договорная</option>
          </Select>

          <Select value={online} onChange={(event) => setOnline(event.target.value)}>
            <option value="">В сети</option>
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </Select>

          <Select value={urgent} onChange={(event) => setUrgent(event.target.value)}>
            <option value="">Срочно</option>
            <option value="true">Да</option>
            <option value="false">Нет</option>
          </Select>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={reset} className="mt-3">
          Сбросить все
        </Button>
      </details>

      <Button type="submit" className="w-full sm:w-auto">
        Найти исполнителя
      </Button>
    </form>
  );
}
