import Link from "next/link";
import { Manrope } from "next/font/google";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { CITY_LABEL } from "@/lib/constants";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"]
});

export const metadata = {
  title: "Работа/Подработка - Дербент",
  description: "MVP площадки поиска исполнителей и подработки в Дербенте"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="ru">
      <body className={manrope.className}>
        <header className="sticky top-0 z-50 border-b bg-white/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Работа/Подработка
              </Link>
              <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline">
                Только {CITY_LABEL}
              </span>
            </div>

            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                Главная
              </Link>
              {session?.user?.role === "EXECUTOR" && (
                <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  Кабинет
                </Link>
              )}
              {session?.user && (
                <Link href="/profile" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  Профиль
                </Link>
              )}

              {session ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <Button type="submit" variant="outline" size="sm">
                    Выйти
                  </Button>
                </form>
              ) : (
                <Button asChild size="sm">
                  <Link href="/auth/signin">Войти</Link>
                </Button>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      </body>
    </html>
  );
}
