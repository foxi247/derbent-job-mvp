import Link from "next/link";
import { auth } from "@/auth";
import { getJobPosts } from "@/lib/jobs";
import { CATEGORIES, CITY_LABEL } from "@/lib/constants";
import { JobCard } from "@/components/jobs/job-card";
import { JobSearchFilters } from "@/components/forms/job-search-filters";
import { Button } from "@/components/ui/button";

type JobsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const session = await auth();

  const query = typeof searchParams.query === "string" ? searchParams.query : undefined;
  const category = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const payType = typeof searchParams.payType === "string" ? (searchParams.payType as any) : undefined;
  const urgent = searchParams.urgent === "true" ? true : searchParams.urgent === "false" ? false : undefined;

  let dbUnavailable = false;
  let jobs: Awaited<ReturnType<typeof getJobPosts>> = [];

  try {
    jobs = await getJobPosts({ query, category, payType, urgent });
  } catch (error) {
    dbUnavailable = true;
    console.error("Failed to fetch jobs", error);
  }

  const ctaHref = session?.user?.role === "EMPLOYER" ? "/dashboard-employer" : "/auth/signin";

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="surface overflow-hidden p-5 md:p-7">
        <div className="grid gap-5 md:grid-cols-[1.5fr_1fr] md:items-center">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Только {CITY_LABEL}
            </p>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Задания от работодателей</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              Публикуйте задачу и быстро находите исполнителей для постоянной работы или разового найма.
            </p>

            <div className="mt-4">
              <Button asChild className="w-full sm:w-auto">
                <Link href={ctaHref}>Разместить задание</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary/70 p-3 text-center sm:grid-cols-3 md:grid-cols-2">
            <div>
              <div className="text-lg font-semibold">{jobs.length}</div>
              <div className="text-xs text-muted-foreground">Заданий</div>
            </div>
            <div>
              <div className="text-lg font-semibold">{CITY_LABEL}</div>
              <div className="text-xs text-muted-foreground">Город</div>
            </div>
            <div className="sm:col-span-3 md:col-span-2">
              <div className="text-lg font-semibold">Gold / Premium</div>
              <div className="text-xs text-muted-foreground">Приоритет публикации</div>
            </div>
          </div>
        </div>
      </section>

      <JobSearchFilters categories={[...CATEGORIES]} />

      {dbUnavailable && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          База данных временно недоступна. Обновите страницу через 10-20 секунд.
        </section>
      )}

      <section id="jobs-list" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Лента заданий</h2>
          <span className="text-sm text-muted-foreground">Найдено: {jobs.length}</span>
        </div>

        {jobs.length === 0 ? (
          <div className="surface p-6 text-sm text-muted-foreground">Заданий по фильтрам пока нет. Попробуйте изменить поиск.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
