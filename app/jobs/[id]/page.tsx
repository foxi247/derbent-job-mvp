import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { maskPhone } from "@/lib/phone";
import { PAY_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactReveal } from "@/components/forms/contact-reveal";
import { MessageForm } from "@/components/forms/message-form";

type JobPageProps = {
  params: {
    id: string;
  };
};

export default async function JobPage({ params }: JobPageProps) {
  const job = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          profile: {
            select: {
              phone: true
            }
          }
        }
      }
    }
  });

  if (!job) {
    notFound();
  }

  const ownerPhone = job.phone ?? job.user.profile?.phone ?? null;
  const maskedPhone = maskPhone(ownerPhone);

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href="/jobs">Назад к заданиям</Link>
      </Button>

      <section className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.category} • {job.user.name ?? "Работодатель"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold">
              {job.payType === "NEGOTIABLE" ? "Договорная" : `${job.payValue ?? "-"} ₽`}
            </p>
            <p className="text-sm text-muted-foreground">{PAY_TYPE_LABELS[job.payType]}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{job.description}</p>

        <div className="flex flex-wrap gap-2">
          {job.urgentToday && <Badge className="bg-amber-100 text-amber-800">Срочно</Badge>}
          <Badge>{job.district ? `Район: ${job.district}` : "Дербент"}</Badge>
          <Badge>{job.status === "ACTIVE" ? "Активно" : job.status === "PAUSED" ? "На паузе" : "Завершено"}</Badge>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface space-y-3 p-5">
          <h2 className="text-lg font-semibold">Контакты работодателя</h2>
          <ContactReveal maskedPhone={maskedPhone} jobPostId={job.id} hasPhone={Boolean(ownerPhone)} />
        </article>

        <MessageForm jobPostId={job.id} title="Откликнуться / Написать" />
      </section>
    </div>
  );
}
