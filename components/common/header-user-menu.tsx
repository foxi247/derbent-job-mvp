"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type HeaderUserMenuProps = {
  isAuthenticated: boolean;
  role?: "EXECUTOR" | "EMPLOYER" | "ADMIN";
  cabinetHref?: "/dashboard" | "/dashboard-employer" | "/admin";
};

export function HeaderUserMenu({ isAuthenticated, role, cabinetHref = "/dashboard" }: HeaderUserMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    if (busy) return;
    setBusy(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Menu className="h-4 w-4" />
          Меню
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Навигация</DialogTitle>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="sm">
              Закрыть
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="grid gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
            Исполнители
          </Link>
          <Link href="/jobs" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
            Задания
          </Link>
          <Link href="/how-it-works" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
            Как это работает
          </Link>
          <Link href="/support" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
            Поддержка
          </Link>
        </div>

        {isAuthenticated ? (
          <div className="grid gap-1 border-t pt-3 text-sm">
            <Link href={cabinetHref} className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
              Кабинет
            </Link>
            <Link href="/profile" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
              Профиль
            </Link>
            <Link href="/notifications" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
              Уведомления
            </Link>
            <Link href="/favorites" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
              Избранное
            </Link>
            <Link href="/saved-searches" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
              Сохраненные поиски
            </Link>
            {role === "ADMIN" && (
              <Link href="/admin" className="rounded-md px-3 py-2 hover:bg-secondary" onClick={() => setOpen(false)}>
                Админка
              </Link>
            )}
            <Button type="button" variant="outline" onClick={onSignOut} disabled={busy} className="mt-2 justify-start">
              {busy ? "Выходим..." : "Выйти"}
            </Button>
          </div>
        ) : (
          <Button asChild className="h-11 w-full">
            <Link href="/auth/signin" onClick={() => setOpen(false)}>
              Войти
            </Link>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
