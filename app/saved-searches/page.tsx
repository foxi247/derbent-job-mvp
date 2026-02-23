import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DeleteSavedSearchButton } from "@/components/forms/delete-saved-search-button";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Сохраненные поиски",
  description: "Ваши сохраненные фильтры поиска",
  alternates: {
    canonical: `${getBaseUrl()}/saved-searches`
  }
};

function toQueryString(params: unknown) {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return "";
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      searchParams.set(key, value);
    }
  }

  return searchParams.toString();
}

export default async function SavedSearchesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const rows = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Сохраненные поиски</h1>
        <p className="mt-1 text-sm text-muted-foreground">Запускайте нужные фильтры в один клик.</p>
      </section>

      <section className="space-y-2">
        {rows.length === 0 ? (
          <div className="surface p-5 text-sm text-muted-foreground">Пока нет сохраненных поисков.</div>
        ) : (
          rows.map((row) => {
            const queryString = toQueryString(row.queryParams);
            const href = row.type === "JOB" ? `/jobs${queryString ? `?${queryString}` : ""}` : `/${queryString ? `?${queryString}` : ""}`;
            return (
              <article key={row.id} className="surface flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{row.type === "JOB" ? "Задания" : "Исполнители"}</p>
                  <p className="truncate text-xs text-muted-foreground">{queryString || "Без фильтров"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={href}>Открыть</Link>
                  </Button>
                  <DeleteSavedSearchButton id={row.id} />
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
