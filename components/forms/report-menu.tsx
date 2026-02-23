"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ReportMenuProps = {
  targetType: "LISTING" | "JOB" | "USER";
  listingId?: string;
  jobPostId?: string;
  targetUserId?: string;
};

export function ReportMenu({ targetType, listingId, jobPostId, targetUserId }: ReportMenuProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType,
        listingId,
        jobPostId,
        targetUserId,
        reason,
        text: text.trim() || null
      })
    });

    setLoading(false);
    const payload = await response.json().catch(() => null);

    if (response.ok) {
      setMessage("Жалоба отправлена");
      setReason("");
      setText("");
      setTimeout(() => {
        setOpen(false);
        setMessage("");
      }, 900);
      return;
    }

    setMessage(payload?.error ?? "Не удалось отправить жалобу");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
          ⋯
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться</DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">
              Закрыть
            </Button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Причина" required />
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Комментарий (опционально)"
            maxLength={1000}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Отправляем..." : "Отправить"}
          </Button>
        </form>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
