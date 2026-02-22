"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
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
  const [priceType, setPriceType] = useState(params.get("priceType") ?? "");
  const [online, setOnline] = useState(params.get("online") ?? "");
  const [urgent, setUrgent] = useState(params.get("urgent") ?? "");
  const [experience, setExperience] = useState(initialExperience);

  function apply(e: FormEvent) {
    e.preventDefault();

    const next = new URLSearchParams();
    if (query) next.set("query", query);
    if (category) next.set("category", category);
    if (priceType) next.set("priceType", priceType);
    if (online) next.set("online", online);
    if (urgent) next.set("urgent", urgent);

    if (experience) {
      const [min, max] = experience.split("-");
      next.set("experienceMin", min);
      if (max) next.set("experienceMax", max);
    }

    router.push(`/?${next.toString()}`);
  }

  function reset() {
    setQuery("");
    setCategory("");
    setPriceType("");
    setOnline("");
    setUrgent("");
    setExperience("");
    router.push("/");
  }

  return (
    <form onSubmit={apply} className="surface grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-7">
      <div className="md:col-span-3 xl:col-span-7">
        <p className="text-sm font-medium">Фильтры поиска</p>
        <p className="text-xs text-muted-foreground">Стаж и статус берутся из профиля исполнителя.</p>
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по названию, категории, описанию"
        className="xl:col-span-2"
      />

      <Select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Категория</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Select value={priceType} onChange={(e) => setPriceType(e.target.value)}>
        <option value="">Тип цены</option>
        <option value="PER_SQM">За м2</option>
        <option value="PER_HOUR">За час</option>
        <option value="FIXED">Фикс</option>
        <option value="NEGOTIABLE">Договорная</option>
      </Select>

      <Select value={online} onChange={(e) => setOnline(e.target.value)}>
        <option value="">В сети</option>
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </Select>

      <Select value={urgent} onChange={(e) => setUrgent(e.target.value)}>
        <option value="">Срочно / сегодня</option>
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </Select>

      <Select value={experience} onChange={(e) => setExperience(e.target.value)}>
        <option value="">Стаж</option>
        <option value="0-1">0-1 год</option>
        <option value="1-3">1-3 года</option>
        <option value="3-5">3-5 лет</option>
        <option value="5-100">5+ лет</option>
      </Select>

      <Button type="submit" className="w-full">
        Применить
      </Button>
      <Button type="button" variant="outline" onClick={reset} className="w-full">
        Сбросить
      </Button>
    </form>
  );
}
