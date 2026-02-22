import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PAY_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { MessageForm } from "@/components/forms/message-form";
import { ContactReveal } from "@/components/forms/contact-reveal";
import { maskPhone } from "@/lib/phone";

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const jobPost = await prisma.jobPost.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          profile: {
            select: {
              phone: true
            }
          }
        }
      }
    }
  });

  if (!jobPost) {
    notFound();
  }

  const contactPhone = jobPost.phone ?? jobPost.user.profile?.phone ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <article className="surface space-y-4 p-5 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{jobPost.title}</h1>
          <p className="text-sm text-muted-foreground">
            {jobPost.category} • Дербент{jobPost.district ? `, ${jobPost.district}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {jobPost.urgentToday && <Badge className="bg-amber-100 text-amber-800">Срочно</Badge>}
          <Badge>
            {jobPost.payType === "NEGOTIABLE"
              ? "Оплата договорная"
              : `${jobPost.payValue != null ? String(jobPost.payValue) : "-"} RUB ${PAY_TYPE_LABELS[jobPost.payType]}`}
          </Badge>
          <Badge>{jobPost.status === "ACTIVE" ? "Активно" : jobPost.status === "PAUSED" ? "На паузе" : "Завершено"}</Badge>
        </div>

        <p className="text-sm leading-6">{jobPost.description}</p>

        <div className="rounded-xl bg-secondary/50 p-4 text-sm">
          <h2 className="mb-2 font-medium">Контакт работодателя</h2>
          <p>
            <span className="text-muted-foreground">Имя:</span> {jobPost.user.name ?? "Не указано"}
          </p>
          <div className="mt-2">
            <ContactReveal
              jobPostId={jobPost.id}
              hasPhone={Boolean(contactPhone)}
              maskedPhone={maskPhone(contactPhone)}
            />
          </div>
        </div>
      </article>

      <aside>
        <MessageForm jobPostId={jobPost.id} title="Откликнуться / написать работодателю" />
      </aside>
    </div>
  );
}
