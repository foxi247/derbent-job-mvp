import type { Metadata } from "next";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { auth } from "@/auth";
import { HeaderUserMenu } from "@/components/common/header-user-menu";
import { NotificationsBell } from "@/components/common/notifications-bell";
import { WalletBalanceWidget } from "@/components/forms/wallet-balance-widget";
import { Button } from "@/components/ui/button";
import { CITY_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "Работа/Подработка - Дербент",
    template: "%s | Работа/Подработка"
  },
  description: "Платформа исполнителей и заданий в Дербенте",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Работа/Подработка - Дербент",
    description: "Исполнители и задания в Дербенте",
    locale: "ru_RU",
    type: "website",
    url: "/"
  }
};

function getCabinetHref(
  role: "EXECUTOR" | "EMPLOYER" | "ADMIN" | undefined
): "/dashboard" | "/dashboard-employer" | "/admin" {
  if (role === "ADMIN") return "/admin";
  if (role === "EMPLOYER") return "/dashboard-employer";
  return "/dashboard";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  const cabinetHref = getCabinetHref(role);

  const unreadCount = session?.user
    ? await prisma.notification.count({
        where: {
          userId: session.user.id,
          isRead: false
        }
      })
    : 0;

  return (
    <html lang="ru">
      <body className={manrope.className}>
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <Link href="/" className="truncate text-base font-semibold tracking-tight sm:text-lg">
                Работа/Подработка
              </Link>
              <p className="text-xs text-muted-foreground">Только {CITY_LABEL}</p>
            </div>

            <nav className="hidden items-center gap-1.5 md:flex">
              <Link href="/" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                Исполнители
              </Link>
              <Link href="/jobs" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                Задания
              </Link>
              {session?.user && (
                <Link href="/favorites" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  Избранное
                </Link>
              )}
              {role === "ADMIN" && (
                <Link href="/admin" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  Админка
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {session?.user ? (
                <>
                  <NotificationsBell unreadCount={unreadCount} />
                  <WalletBalanceWidget initialBalanceRub={session.user.balanceRub} />
                  <Button asChild size="sm" className="hidden sm:inline-flex">
                    <Link href={cabinetHref}>Кабинет</Link>
                  </Button>
                  <HeaderUserMenu isAuthenticated role={role} cabinetHref={cabinetHref} />
                </>
              ) : (
                <>
                  <Button asChild size="sm" className="hidden sm:inline-flex">
                    <Link href="/auth/signin">Войти</Link>
                  </Button>
                  <HeaderUserMenu isAuthenticated={false} />
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
        <footer className="border-t bg-white/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 text-xs text-muted-foreground md:px-6">
            <Link href="/how-it-works" className="hover:text-foreground">
              Как это работает
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Конфиденциальность
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Соглашение
            </Link>
            <Link href="/support" className="hover:text-foreground">
              Поддержка
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
