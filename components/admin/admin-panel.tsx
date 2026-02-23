"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "EXECUTOR" | "EMPLOYER" | "ADMIN";
  balanceRub: number;
  isBanned: boolean;
  bannedAt: string | null;
  createdAt: string;
  _count: {
    listings: number;
    jobPosts: number;
    topUpRequests: number;
  };
};

type AdminTopUp = {
  id: string;
  amountRub: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  proofText: string | null;
  adminNote: string | null;
  createdAt: string;
  expiresAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  approver: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type AdminSettings = {
  id: string;
  bankName: string;
  cardNumber: string | null;
  phoneNumber: string | null;
  recipientName: string;
  instructions: string;
  updatedAt: string;
} | null;

type TariffPlan = {
  id: string;
  name: string;
  priceRub: number;
  durationDays: number;
  kind: "BASIC" | "PREMIUM" | "GOLD";
  discountPercent: number;
  isActive: boolean;
  sortOrder: number;
};

type TariffDraft = {
  name: string;
  priceRub: string;
  durationDays: string;
  kind: "BASIC" | "PREMIUM" | "GOLD";
  discountPercent: string;
  isActive: boolean;
  sortOrder: string;
};

const topUpStatusLabel = {
  PENDING: "Ожидает",
  APPROVED: "Подтверждено",
  REJECTED: "Отклонено",
  EXPIRED: "Истекло"
} as const;

function toTariffDraft(tariff: TariffPlan): TariffDraft {
  return {
    name: tariff.name,
    priceRub: String(tariff.priceRub),
    durationDays: String(tariff.durationDays),
    kind: tariff.kind,
    discountPercent: String(tariff.discountPercent),
    isActive: tariff.isActive,
    sortOrder: String(tariff.sortOrder)
  };
}

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [topUps, setTopUps] = useState<AdminTopUp[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(null);
  const [tariffs, setTariffs] = useState<TariffPlan[]>([]);
  const [tariffDrafts, setTariffDrafts] = useState<Record<string, TariffDraft>>({});

  const [userQuery, setUserQuery] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userBanned, setUserBanned] = useState("");
  const [topUpStatusFilter, setTopUpStatusFilter] = useState("");

  const [newTariff, setNewTariff] = useState<TariffDraft>({
    name: "",
    priceRub: "200",
    durationDays: "7",
    kind: "BASIC",
    discountPercent: "0",
    isActive: true,
    sortOrder: "10"
  });

  const [settingsForm, setSettingsForm] = useState({
    bankName: "",
    cardNumber: "",
    phoneNumber: "",
    recipientName: "",
    instructions: ""
  });

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const pendingTopUps = useMemo(() => topUps.filter((item) => item.status === "PENDING").length, [topUps]);

  useEffect(() => {
    void Promise.all([loadUsers(), loadTopUps(), loadSettings(), loadTariffs()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    const params = new URLSearchParams();
    if (userQuery) params.set("query", userQuery);
    if (userRole) params.set("role", userRole);
    if (userBanned) params.set("isBanned", userBanned);

    const response = await fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    setUsers(data);
  }

  async function loadTopUps() {
    const params = new URLSearchParams();
    if (topUpStatusFilter) params.set("status", topUpStatusFilter);

    const response = await fetch(`/api/admin/topups?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    setTopUps(data);
  }

  async function loadSettings() {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    setSettings(data);
    if (data) {
      setSettingsForm({
        bankName: data.bankName ?? "",
        cardNumber: data.cardNumber ?? "",
        phoneNumber: data.phoneNumber ?? "",
        recipientName: data.recipientName ?? "",
        instructions: data.instructions ?? ""
      });
    }
  }

  async function loadTariffs() {
    const response = await fetch("/api/admin/tariffs", { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    setTariffs(data);
    const drafts: Record<string, TariffDraft> = {};
    for (const tariff of data as TariffPlan[]) {
      drafts[tariff.id] = toTariffDraft(tariff);
    }
    setTariffDrafts(drafts);
  }

  async function toggleBan(userId: string, isBanned: boolean) {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/users/${userId}/ban`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned })
    });

    setBusy(false);
    if (response.ok) {
      setMessage("Статус пользователя обновлен");
      await loadUsers();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось изменить блокировку");
  }

  async function processTopUp(id: string, action: "approve" | "reject") {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/topups/${id}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: null })
    });

    setBusy(false);

    if (response.ok) {
      setMessage(action === "approve" ? "Пополнение подтверждено" : "Пополнение отклонено");
      await Promise.all([loadTopUps(), loadUsers()]);
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось обработать заявку");
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName: settingsForm.bankName,
        cardNumber: settingsForm.cardNumber || null,
        phoneNumber: settingsForm.phoneNumber || null,
        recipientName: settingsForm.recipientName,
        instructions: settingsForm.instructions
      })
    });

    setBusy(false);

    if (response.ok) {
      setMessage("Реквизиты сохранены");
      await loadSettings();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось сохранить реквизиты");
  }

  async function createTariff(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/admin/tariffs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTariff.name,
        priceRub: Number(newTariff.priceRub),
        durationDays: Number(newTariff.durationDays),
        kind: newTariff.kind,
        discountPercent: Number(newTariff.discountPercent),
        isActive: newTariff.isActive,
        sortOrder: Number(newTariff.sortOrder)
      })
    });

    setBusy(false);

    if (response.ok) {
      setMessage("Тариф создан");
      setNewTariff({
        name: "",
        priceRub: "200",
        durationDays: "7",
        kind: "BASIC",
        discountPercent: "0",
        isActive: true,
        sortOrder: "10"
      });
      await loadTariffs();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось создать тариф");
  }

  function updateTariffDraft(id: string, patch: Partial<TariffDraft>) {
    setTariffDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch
      }
    }));
  }

  async function saveTariff(id: string) {
    const draft = tariffDrafts[id];
    if (!draft) return;

    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/tariffs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        priceRub: Number(draft.priceRub),
        durationDays: Number(draft.durationDays),
        kind: draft.kind,
        discountPercent: Number(draft.discountPercent),
        isActive: draft.isActive,
        sortOrder: Number(draft.sortOrder)
      })
    });

    setBusy(false);

    if (response.ok) {
      setMessage("Тариф обновлен");
      await loadTariffs();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось обновить тариф");
  }

  async function deactivateTariff(id: string) {
    setBusy(true);
    setMessage("");

    const response = await fetch(`/api/admin/tariffs/${id}`, {
      method: "DELETE"
    });

    setBusy(false);

    if (response.ok) {
      setMessage("Тариф отключен");
      await loadTariffs();
      return;
    }

    const payload = await response.json().catch(() => null);
    setMessage(payload?.error ?? "Не удалось отключить тариф");
  }

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Админ-панель</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Пользователи, ручные пополнения, реквизиты и тарифы в одном месте.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Заявок на подтверждение: {pendingTopUps}</p>
        {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
      </section>

      <section className="surface space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-semibold">Пользователи</h2>

        <form
          className="grid gap-2 sm:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            void loadUsers();
          }}
        >
          <Input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Поиск по имени/email" />
          <Select value={userRole} onChange={(event) => setUserRole(event.target.value)}>
            <option value="">Роль</option>
            <option value="EXECUTOR">Исполнитель</option>
            <option value="EMPLOYER">Работодатель</option>
            <option value="ADMIN">Админ</option>
          </Select>
          <Select value={userBanned} onChange={(event) => setUserBanned(event.target.value)}>
            <option value="">Блокировка</option>
            <option value="true">Только заблокированные</option>
            <option value="false">Только активные</option>
          </Select>
          <Button type="submit" disabled={busy}>
            Обновить
          </Button>
        </form>

        <div className="space-y-2">
          {users.map((user) => (
            <article key={user.id} className="rounded-xl border bg-background/70 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{user.name ?? "Без имени"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email ?? "без email"} • {user.role} • Баланс: {user.balanceRub} ₽
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={busy || user.role === "ADMIN"} onClick={() => void toggleBan(user.id, user.isBanned)}>
                  {user.isBanned ? "Разблокировать" : "Заблокировать"}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Анкет: {user._count.listings}, заданий: {user._count.jobPosts}, пополнений: {user._count.topUpRequests}
              </p>
            </article>
          ))}
          {users.length === 0 && <p className="text-sm text-muted-foreground">Пользователи не найдены.</p>}
        </div>
      </section>

      <section className="surface space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-semibold">Пополнения</h2>

        <div className="flex items-center gap-2">
          <Select value={topUpStatusFilter} onChange={(event) => setTopUpStatusFilter(event.target.value)}>
            <option value="">Все статусы</option>
            <option value="PENDING">Ожидает</option>
            <option value="APPROVED">Подтверждено</option>
            <option value="REJECTED">Отклонено</option>
            <option value="EXPIRED">Истекло</option>
          </Select>
          <Button type="button" variant="outline" onClick={() => void loadTopUps()} disabled={busy}>
            Применить
          </Button>
        </div>

        <div className="space-y-2">
          {topUps.map((request) => (
            <article key={request.id} className="rounded-xl border bg-background/70 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {request.amountRub} ₽ • {topUpStatusLabel[request.status]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.user.name ?? "Пользователь"} ({request.user.email ?? "без email"})
                  </p>
                  <p className="text-xs text-muted-foreground">Создано: {new Date(request.createdAt).toLocaleString("ru-RU")}</p>
                  {request.proofText && <p className="text-xs">Комментарий: {request.proofText}</p>}
                </div>

                {request.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void processTopUp(request.id, "approve")} disabled={busy}>
                      Подтвердить
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void processTopUp(request.id, "reject")} disabled={busy}>
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
          {topUps.length === 0 && <p className="text-sm text-muted-foreground">Заявок нет.</p>}
        </div>
      </section>

      <section className="surface space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-semibold">Реквизиты</h2>

        <form onSubmit={saveSettings} className="grid gap-2">
          <Input
            value={settingsForm.bankName}
            onChange={(event) => setSettingsForm((prev) => ({ ...prev, bankName: event.target.value }))}
            placeholder="Банк"
            required
          />
          <Input
            value={settingsForm.recipientName}
            onChange={(event) => setSettingsForm((prev) => ({ ...prev, recipientName: event.target.value }))}
            placeholder="Получатель"
            required
          />
          <Input
            value={settingsForm.cardNumber}
            onChange={(event) => setSettingsForm((prev) => ({ ...prev, cardNumber: event.target.value }))}
            placeholder="Номер карты (опционально)"
          />
          <Input
            value={settingsForm.phoneNumber}
            onChange={(event) => setSettingsForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
            placeholder="Телефон для перевода (опционально)"
          />
          <Textarea
            value={settingsForm.instructions}
            onChange={(event) => setSettingsForm((prev) => ({ ...prev, instructions: event.target.value }))}
            placeholder="Инструкция для оплаты"
            required
          />

          <Button type="submit" className="w-full sm:w-auto" disabled={busy}>
            Сохранить реквизиты
          </Button>
        </form>

        {settings?.updatedAt && (
          <p className="text-xs text-muted-foreground">Обновлено: {new Date(settings.updatedAt).toLocaleString("ru-RU")}</p>
        )}
      </section>

      <section className="surface space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-semibold">Тарифы</h2>

        <form onSubmit={createTariff} className="grid gap-2 rounded-xl border bg-background/70 p-3">
          <p className="text-sm font-medium">Создать тариф</p>
          <Input
            value={newTariff.name}
            onChange={(event) => setNewTariff((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Название"
            required
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              type="number"
              value={newTariff.priceRub}
              onChange={(event) => setNewTariff((prev) => ({ ...prev, priceRub: event.target.value }))}
              placeholder="Цена"
              required
            />
            <Input
              type="number"
              value={newTariff.durationDays}
              onChange={(event) => setNewTariff((prev) => ({ ...prev, durationDays: event.target.value }))}
              placeholder="Длительность, дней"
              required
            />
            <Input
              type="number"
              value={newTariff.discountPercent}
              onChange={(event) => setNewTariff((prev) => ({ ...prev, discountPercent: event.target.value }))}
              placeholder="Скидка, %"
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={newTariff.kind} onChange={(event) => setNewTariff((prev) => ({ ...prev, kind: event.target.value as TariffDraft["kind"] }))}>
              <option value="BASIC">BASIC</option>
              <option value="PREMIUM">PREMIUM</option>
              <option value="GOLD">GOLD</option>
            </Select>
            <Input
              type="number"
              value={newTariff.sortOrder}
              onChange={(event) => setNewTariff((prev) => ({ ...prev, sortOrder: event.target.value }))}
              placeholder="Порядок"
              required
            />
          </div>

          <Button type="submit" disabled={busy} className="w-full sm:w-auto">
            Создать тариф
          </Button>
        </form>

        <div className="space-y-2">
          {tariffs.map((tariff) => {
            const draft = tariffDrafts[tariff.id] ?? toTariffDraft(tariff);
            return (
              <article key={tariff.id} className="rounded-xl border bg-background/70 p-3 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <Input value={draft.name} onChange={(event) => updateTariffDraft(tariff.id, { name: event.target.value })} />
                  <Select
                    value={draft.kind}
                    onChange={(event) => updateTariffDraft(tariff.id, { kind: event.target.value as TariffDraft["kind"] })}
                  >
                    <option value="BASIC">BASIC</option>
                    <option value="PREMIUM">PREMIUM</option>
                    <option value="GOLD">GOLD</option>
                  </Select>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  <Input
                    type="number"
                    value={draft.priceRub}
                    onChange={(event) => updateTariffDraft(tariff.id, { priceRub: event.target.value })}
                    placeholder="Цена"
                  />
                  <Input
                    type="number"
                    value={draft.durationDays}
                    onChange={(event) => updateTariffDraft(tariff.id, { durationDays: event.target.value })}
                    placeholder="Дней"
                  />
                  <Input
                    type="number"
                    value={draft.discountPercent}
                    onChange={(event) => updateTariffDraft(tariff.id, { discountPercent: event.target.value })}
                    placeholder="Скидка"
                  />
                  <Input
                    type="number"
                    value={draft.sortOrder}
                    onChange={(event) => updateTariffDraft(tariff.id, { sortOrder: event.target.value })}
                    placeholder="Порядок"
                  />
                </div>

                <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => updateTariffDraft(tariff.id, { isActive: event.target.checked })}
                  />
                  Тариф активен
                </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void saveTariff(tariff.id)} disabled={busy}>
                    Сохранить
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void deactivateTariff(tariff.id)} disabled={busy}>
                    Отключить
                  </Button>
                </div>
              </article>
            );
          })}
          {tariffs.length === 0 && <p className="text-sm text-muted-foreground">Тарифов пока нет.</p>}
        </div>
      </section>
    </div>
  );
}
