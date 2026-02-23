"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Loader2, Wallet, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type TopUpStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

type TopUpRequestDto = {
  id: string;
  amountRub: number;
  status: TopUpStatus;
  proofText: string | null;
  adminNote: string | null;
  expiresAt: string;
};

type RequisitesDto = {
  bankName: string;
  cardNumber: string | null;
  phoneNumber: string | null;
  recipientName: string;
  instructions: string;
} | null;

type TopUpResponseDto = {
  balanceRub?: number;
  requisites?: RequisitesDto;
  requests?: TopUpRequestDto[];
  serverNow?: string;
};

type WalletBalanceWidgetProps = {
  initialBalanceRub: number;
};

const WATCH_REQUEST_STORAGE_KEY = "derbent:wallet:watch-request-id";

function formatRub(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function formatRemaining(ms: number) {
  if (ms <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function WalletBalanceWidget({ initialBalanceRub }: WalletBalanceWidgetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amountRub, setAmountRub] = useState("1000");
  const [proofText, setProofText] = useState("");
  const [balanceRub, setBalanceRub] = useState(initialBalanceRub);
  const [requests, setRequests] = useState<TopUpRequestDto[]>([]);
  const [requisites, setRequisites] = useState<RequisitesDto>(null);
  const [watchRequestId, setWatchRequestId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  const pendingRequest = useMemo(
    () => requests.find((request) => request.status === "PENDING") ?? null,
    [requests]
  );

  const watchedRequest = useMemo(() => {
    if (!watchRequestId) {
      return null;
    }

    return requests.find((request) => request.id === watchRequestId) ?? null;
  }, [requests, watchRequestId]);

  const activeRequest = pendingRequest ?? watchedRequest;

  const remainingMs =
    activeRequest?.status === "PENDING" ? new Date(activeRequest.expiresAt).getTime() - nowMs : 0;

  function persistWatchRequest(id: string | null) {
    setWatchRequestId(id);
    if (typeof window === "undefined") {
      return;
    }

    if (id) {
      window.localStorage.setItem(WATCH_REQUEST_STORAGE_KEY, id);
      return;
    }

    window.localStorage.removeItem(WATCH_REQUEST_STORAGE_KEY);
  }

  async function refreshTopUps() {
    try {
      const response = await fetch("/api/topups", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as TopUpResponseDto;
      setBalanceRub(data.balanceRub ?? 0);
      setRequisites(data.requisites ?? null);
      setRequests(data.requests ?? []);
      setNowMs(data.serverNow ? new Date(data.serverNow).getTime() : Date.now());
    } catch {
      // no-op for compact widget
    }
  }

  async function createTopUpRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const numericAmount = Number(amountRub);
    if (!Number.isFinite(numericAmount) || numericAmount < 100) {
      setMessage("Минимальная сумма: 100 ₽");
      return;
    }

    setBusy(true);
    const response = await fetch("/api/topups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountRub: numericAmount })
    });
    setBusy(false);

    const data = (await response.json().catch(() => null)) as
      | ({ request?: TopUpRequestDto; requisites?: RequisitesDto } & { error?: string })
      | null;

    if (!response.ok) {
      setMessage(data?.error ?? "Не удалось создать заявку");
      await refreshTopUps();
      return;
    }

    if (data?.request?.id) {
      persistWatchRequest(data.request.id);
    }

    setProofText("");
    setMessage("Реквизиты сформированы. Оплатите и нажмите «Я оплатил».");
    await refreshTopUps();
  }

  async function confirmPaid() {
    if (!activeRequest || activeRequest.status !== "PENDING") {
      return;
    }

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/topups/${activeRequest.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofText: proofText.trim() || null })
    });
    setBusy(false);

    const data = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setMessage(data?.error ?? "Не удалось отправить подтверждение");
      await refreshTopUps();
      return;
    }

    setMessage("Платеж отмечен. Ожидайте подтверждения администратора.");
    await refreshTopUps();
  }

  function resetToNewRequest() {
    persistWatchRequest(null);
    setProofText("");
    setMessage("");
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedRequestId = window.localStorage.getItem(WATCH_REQUEST_STORAGE_KEY);
    if (storedRequestId) {
      setWatchRequestId(storedRequestId);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void refreshTopUps();

    const pollId = window.setInterval(() => {
      void refreshTopUps();
    }, 10_000);

    const tickId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(pollId);
      window.clearInterval(tickId);
    };
  }, [open]);

  useEffect(() => {
    if (!open || watchRequestId || !pendingRequest) {
      return;
    }

    persistWatchRequest(pendingRequest.id);
  }, [open, watchRequestId, pendingRequest]);

  useEffect(() => {
    if (!watchRequestId) {
      return;
    }

    const isPresent = requests.some((request) => request.id === watchRequestId);
    if (isPresent) {
      return;
    }

    persistWatchRequest(null);
  }, [requests, watchRequestId]);

  useEffect(() => {
    if (!open || !activeRequest || activeRequest.status !== "APPROVED") {
      return;
    }

    const closeTimerId = window.setTimeout(() => {
      setOpen(false);
      setMessage("");
      setProofText("");
      persistWatchRequest(null);
      router.refresh();
    }, 2_000);

    return () => window.clearTimeout(closeTimerId);
  }, [open, activeRequest, router]);

  useEffect(() => {
    setBalanceRub(initialBalanceRub);
  }, [initialBalanceRub]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setMessage("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2 rounded-full px-3">
          <Wallet className="h-4 w-4" />
          <span className="text-xs font-semibold tabular-nums sm:text-sm">{formatRub(balanceRub)}</span>
        </Button>
      </DialogTrigger>

      <DialogContent aria-labelledby="wallet-topup-title">
        <DialogHeader>
          <div>
            <DialogTitle id="wallet-topup-title">Пополнение баланса</DialogTitle>
            <p className="mt-1 text-xs text-muted-foreground">Текущий баланс: {formatRub(balanceRub)}</p>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {!activeRequest && (
          <form onSubmit={createTopUpRequest} className="space-y-3">
            <Input
              type="number"
              min={100}
              value={amountRub}
              onChange={(event) => setAmountRub(event.target.value)}
              placeholder="Сумма пополнения, ₽"
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создаем заявку...
                </>
              ) : (
                "Оплатить"
              )}
            </Button>
          </form>
        )}

        {activeRequest?.status === "PENDING" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Clock3 className="h-4 w-4" />
                Заявка в ожидании: {formatRub(activeRequest.amountRub)}
              </p>
              <p className="mt-1 text-amber-900/90">
                Оплатите в течение: <span className="font-semibold">{formatRemaining(remainingMs)}</span>
              </p>
            </div>

            {remainingMs > 0 ? (
              <>
                <div className="space-y-1 rounded-xl border bg-background/80 p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Банк:</span> {requisites?.bankName ?? "Не указано"}
                  </p>
                  {requisites?.recipientName && (
                    <p>
                      <span className="text-muted-foreground">Получатель:</span> {requisites.recipientName}
                    </p>
                  )}
                  {requisites?.cardNumber && (
                    <p>
                      <span className="text-muted-foreground">Карта:</span> {requisites.cardNumber}
                    </p>
                  )}
                  {requisites?.phoneNumber && (
                    <p>
                      <span className="text-muted-foreground">Телефон:</span> {requisites.phoneNumber}
                    </p>
                  )}
                  {requisites?.instructions && <p className="pt-1 text-muted-foreground">{requisites.instructions}</p>}
                </div>

                <div className="space-y-2">
                  <Input
                    value={proofText}
                    onChange={(event) => setProofText(event.target.value)}
                    placeholder="Комментарий / номер перевода (необязательно)"
                  />
                  <Button type="button" className="w-full" onClick={confirmPaid} disabled={busy}>
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Отправляем...
                      </>
                    ) : (
                      "Я оплатил"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-medium">Время оплаты истекло.</p>
                <Button type="button" variant="outline" className="w-full" onClick={resetToNewRequest}>
                  Создать новую заявку
                </Button>
              </div>
            )}
          </div>
        )}

        {activeRequest?.status === "APPROVED" && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Баланс успешно пополнен
            </p>
            <p className="mt-1">Заявка подтверждена. Окно закроется автоматически.</p>
          </div>
        )}

        {activeRequest?.status === "REJECTED" && (
          <div className="space-y-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <p className="flex items-center gap-2 font-medium">
              <XCircle className="h-4 w-4" />
              Пополнение отклонено
            </p>
            {activeRequest.adminNote && <p>Комментарий администратора: {activeRequest.adminNote}</p>}
            <Button type="button" variant="outline" className="w-full" onClick={resetToNewRequest}>
              Создать новую заявку
            </Button>
          </div>
        )}

        {activeRequest?.status === "EXPIRED" && (
          <div className="space-y-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Время оплаты истекло</p>
            <Button type="button" variant="outline" className="w-full" onClick={resetToNewRequest}>
              Создать новую заявку
            </Button>
          </div>
        )}

        {message && <p className="mt-3 text-xs text-muted-foreground">{message}</p>}
      </DialogContent>
    </Dialog>
  );
}
