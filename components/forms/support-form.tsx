"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SupportForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contact,
        text
      })
    });

    setLoading(false);

    if (response.ok) {
      setMessage("Сообщение отправлено. Мы свяжемся с вами.");
      setName("");
      setContact("");
      setText("");
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось отправить сообщение");
  }

  return (
    <form onSubmit={submit} className="surface space-y-3 p-5">
      <h2 className="text-lg font-semibold">Форма обращения</h2>
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ваше имя" required />
      <Input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Контакт: телефон, email или Telegram" required />
      <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Опишите вопрос" required />
      <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
        {loading ? "Отправляем..." : "Отправить"}
      </Button>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </form>
  );
}
