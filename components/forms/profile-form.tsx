"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProfileInitial = {
  about: string;
  experienceYears: number;
  skills: string;
  availability: string;
  phone: string;
};

const EXPERIENCE_PRESETS = [0, 1, 2, 3, 5, 7, 10];

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [about, setAbout] = useState(initial.about);
  const [experienceYears, setExperienceYears] = useState(String(initial.experienceYears));
  const [skills, setSkills] = useState(initial.skills);
  const [availability, setAvailability] = useState(initial.availability);
  const [phone, setPhone] = useState(initial.phone);
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const normalizedYears = useMemo(() => {
    const value = Number(experienceYears);
    return Number.isFinite(value) ? value : 0;
  }, [experienceYears]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setResult("");

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        about,
        experienceYears: normalizedYears,
        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        availability,
        phone: phone.trim() ? phone.trim() : null
      })
    });

    setIsSaving(false);

    if (response.ok) {
      setResult("Профиль сохранен");
    } else {
      const data = await response.json().catch(() => null);
      const details = data?.error ? " Проверьте поля формы." : "";
      setResult(`Ошибка сохранения.${details}`);
    }
  }

  return (
    <form onSubmit={submit} className="surface space-y-3 p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Профиль пользователя</h2>
        <p className="text-xs text-muted-foreground">Телефон скрывается и открывается только авторизованным по кнопке.</p>
      </div>

      <Textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Кто вы, какой опыт и задачи берете (для работодателя можно оставить пустым)" />

      <div className="grid gap-2 md:grid-cols-2">
        <Select value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}>
          <option value="0">Стаж: 0 лет</option>
          {EXPERIENCE_PRESETS.filter((v) => v > 0).map((v) => (
            <option key={v} value={String(v)}>
              Стаж: {v} {v === 1 ? "год" : v < 5 ? "года" : "лет"}
            </option>
          ))}
          {normalizedYears > 10 && <option value={String(normalizedYears)}>Стаж: {normalizedYears} лет</option>}
        </Select>

        <Input
          type="number"
          min={0}
          max={60}
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          placeholder="Или введите вручную"
        />
      </div>

      <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Навыки через запятую (опционально)" />
      <Input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="График/доступность (опционально)" />
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон (опционально), например +7 928 000-00-00" />

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Сохраняем..." : "Сохранить"}
      </Button>

      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
