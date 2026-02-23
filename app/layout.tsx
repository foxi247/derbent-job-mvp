import Link from "next/link";
import { Manrope } from "next/font/google";
import { auth, signOut } from "@/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { WalletBalanceWidget } from "@/components/forms/wallet-balance-widget";
import { CITY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"]
});

export const metadata = {
  title: "Работа/Подработка - Дербент",
  description: "Платформа поиска исполнителей и заданий в Дербенте"
};

function getCabinetHref(role: "EXECUTOR" | "EMPLOYER" | "ADMIN" | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "EMPLOYER") return "/dashboard-employer";
  return "/dashboard";
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  const cabinetHref = getCabinetHref(role);

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
              {role === "ADMIN" && (
                <Link href="/admin" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  Админка
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {session?.user ? (
                <>
                  <WalletBalanceWidget initialBalanceRub={session.user.balanceRub} />

                  <Button asChild size="sm" className="hidden sm:inline-flex">
                    <Link href={cabinetHref}>Кабинет</Link>
                  </Button>

                  <details className="relative">
                    <summary
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "list-none cursor-pointer select-none"
                      )}
                    >
                      Меню
                    </summary>
                    <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border bg-white p-2 shadow-lg">
                      <Link href={cabinetHref} className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">
                        Кабинет
                      </Link>
                      <Link href="/profile" className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">
                        Профиль
                      </Link>
                      {role === "ADMIN" && (
                        <Link href="/admin" className="block rounded-md px-3 py-2 text-sm hover:bg-secondary">
                          Админка
                        </Link>
                      )}
                      <form
                        action={async () => {
                          "use server";
                          await signOut({ redirectTo: "/" });
                        }}
                      >
                        <button type="submit" className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary">
                          Выйти
                        </button>
                      </form>
                    </div>
                  </details>
                </>
              ) : (
                <Button asChild size="sm">
                  <Link href="/auth/signin">Войти</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="border-t px-4 py-2 md:hidden">
            <details>
              <summary className="cursor-pointer text-sm font-medium">Навигация</summary>
              <div className="mt-2 grid gap-1">
                <Link href="/" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                  Исполнители
                </Link>
                <Link href="/jobs" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                  Задания
                </Link>
                {session?.user && (
                  <Link href={cabinetHref} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                    Кабинет
                  </Link>
                )}
                {session?.user && (
                  <Link href="/profile" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                    Профиль
                  </Link>
                )}
                {role === "ADMIN" && (
                  <Link href="/admin" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                    Админка
                  </Link>
                )}
                {session?.user && (
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-secondary">
                      Выйти
                    </button>
                  </form>
                )}
              </div>
            </details>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      </body>
    </html>
  );
}

