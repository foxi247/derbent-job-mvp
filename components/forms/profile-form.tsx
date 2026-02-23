"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ProfileInitial = {
  about: string;
  gender: "MALE" | "FEMALE" | null;
  age: number | null;
  workCategory: string;
  previousWork: string;
  experienceYears: number;
  skills: string;
  availability: string;
  phone: string;
};

type Role = "EXECUTOR" | "EMPLOYER" | "ADMIN";

const EXPERIENCE_PRESETS = [0, 1, 2, 3, 5, 7, 10];

export function ProfileForm({ initial, role }: { initial: ProfileInitial; role: Role }) {
  const router = useRouter();
  const [about, setAbout] = useState(initial.about);
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">(initial.gender ?? "");
  const [age, setAge] = useState(initial.age != null ? String(initial.age) : "");
  const [workCategory, setWorkCategory] = useState(initial.workCategory);
  const [previousWork, setPreviousWork] = useState(initial.previousWork);
  const [experienceYears, setExperienceYears] = useState(String(initial.experienceYears));
  const [skills, setSkills] = useState(initial.skills);
  const [availability, setAvailability] = useState(initial.availability);
  const [phone, setPhone] = useState(initial.phone);
  const [result, setResult] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const normalizedYears = useMemo(() => {
    const value = Number(experienceYears);
    return Number.isFinite(value) ? Math.max(0, Math.min(60, Math.trunc(value))) : 0;
  }, [experienceYears]);

  const normalizedAge = useMemo(() => {
    if (!age.trim()) {
      return null;
    }

    const value = Number(age);
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.max(14, Math.min(90, Math.trunc(value)));
  }, [age]);

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (role === "EXECUTOR") {
      if (!phone.trim()) {
        setResult("Телефон обязателен для исполнителя");
        return;
      }

      if (!workCategory.trim()) {
        setResult("Укажите категорию, по которой ищете работу");
        return;
      }
    }

    setIsSaving(true);
    setResult("");

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        about,
        gender: gender || null,
        age: normalizedAge,
        workCategory: workCategory.trim() || null,
        previousWork: previousWork.trim() || null,
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
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => null);
    const details = data?.error ? " Проверьте поля формы." : "";
    setResult(`Ошибка сохранения.${details}`);
  }

  return (
    <form onSubmit={submit} className="surface space-y-4 p-4 md:p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Профиль</h2>
        <p className="text-sm text-muted-foreground">Телефон скрыт и открывается только авторизованным по кнопке.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={gender} onChange={(event) => setGender(event.target.value as "MALE" | "FEMALE" | "") }>
          <option value="">Пол</option>
          <option value="MALE">Мужской</option>
          <option value="FEMALE">Женский</option>
        </Select>

        <Input type="number" min={14} max={90} value={age} onChange={(event) => setAge(event.target.value)} placeholder="Возраст" />
      </div>

      <Input
        value={workCategory}
        onChange={(event) => setWorkCategory(event.target.value)}
        placeholder="Категория (бариста, курьер, уборка...)"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Select value={experienceYears} onChange={(event) => setExperienceYears(event.target.value)}>
          {EXPERIENCE_PRESETS.map((value) => (
            <option key={value} value={String(value)}>
              Стаж: {value} {value === 1 ? "год" : value < 5 ? "года" : "лет"}
            </option>
          ))}
          {normalizedYears > 10 && <option value={String(normalizedYears)}>Стаж: {normalizedYears} лет</option>}
        </Select>

        <Input
          type="number"
          min={0}
          max={60}
          value={experienceYears}
          onChange={(event) => setExperienceYears(event.target.value)}
          placeholder="Или введите стаж вручную"
        />
      </div>

      <Input
        value={previousWork}
        onChange={(event) => setPreviousWork(event.target.value)}
        placeholder="Где работали раньше (опционально)"
      />

      <Textarea value={about} onChange={(event) => setAbout(event.target.value)} placeholder="Коротко о себе" />

      <details className="rounded-lg border bg-background/70 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Дополнительно</summary>
        <div className="mt-3 grid gap-2">
          <Input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Навыки через запятую (опционально)"
          />
          <Input
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
            placeholder="График/доступность"
          />
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Телефон"
            required={role === "EXECUTOR"}
          />
        </div>
      </details>

      <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
        {isSaving ? "Сохраняем..." : "Сохранить"}
      </Button>

      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
