"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusAlert } from "@/components/ui/status-alert";
import { Textarea } from "@/components/ui/textarea";
import { extractApiErrorMessage } from "@/lib/api-response";

type ApplicationStatus = "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELED";

type Application = {
  id: string;
  status: ApplicationStatus;
  message: string | null;
};

type JobApplyWidgetProps = {
  jobPostId: string;
  initialApplication: Application | null;
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SENT: "Отправлен",
  VIEWED: "Просмотрен",
  ACCEPTED: "Принят",
  REJECTED: "Отклонен",
  COMPLETED: "Завершен",
  CANCELED: "Отменен"
};

export function JobApplyWidget({ jobPostId, initialApplication }: JobApplyWidgetProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialApplication?.message ?? "");
  const [application, setApplication] = useState<Application | null>(initialApplication);
  const [result, setResult] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setResult("");
    setIsError(false);

    const response = await fetch(`/api/jobs/${jobPostId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() || null })
    });

    setLoading(false);

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setIsError(true);
      setResult(extractApiErrorMessage(payload, "Не удалось отправить отклик"));
      return;
    }

    setApplication(payload as Application);
    setResult("Отклик отправлен");
    setOpen(false);
  }

  if (application) {
    return (
      <div className="space-y-2">
        <Button type="button" className="w-full sm:w-auto" disabled>
          Статус: {STATUS_LABELS[application.status]}
        </Button>
        {result && <StatusAlert message={result} tone={isError ? "error" : "success"} className="text-xs" />}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="w-full sm:w-auto">
          Откликнуться
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отклик на задание</DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">
              Закрыть
            </Button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Короткое сообщение работодателю (опционально)"
            maxLength={600}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправляем...
              </>
            ) : (
              "Отправить"
            )}
          </Button>
        </form>

        {result && <StatusAlert message={result} tone={isError ? "error" : "success"} className="text-xs" />}
      </DialogContent>
    </Dialog>
  );
}

