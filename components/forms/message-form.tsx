"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MessageFormProps = {
  listingId?: string;
  jobPostId?: string;
  title?: string;
};

export function MessageForm({ listingId, jobPostId, title = "Написать" }: MessageFormProps) {
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setIsSending(true);
    setResult("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, jobPostId, senderName, senderContact, text })
    });

    setIsSending(false);
    setResult(res.ok ? "Сообщение отправлено" : "Не удалось отправить сообщение");
    if (res.ok) {
      setSenderName("");
      setSenderContact("");
      setText("");
    }
  }

  return (
    <form onSubmit={submit} className="surface space-y-2 p-4">
      <h3 className="font-medium">{title}</h3>
      <Input required value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Ваше имя" />
      <Input required value={senderContact} onChange={(e) => setSenderContact(e.target.value)} placeholder="Контакт: email или мессенджер" />
      <Textarea required value={text} onChange={(e) => setText(e.target.value)} placeholder="Текст сообщения" />
      <Button type="submit" disabled={isSending}>
        {isSending ? "Отправляем..." : "Отправить"}
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </form>
  );
}
