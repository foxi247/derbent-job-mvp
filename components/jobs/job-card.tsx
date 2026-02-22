import Link from "next/link";
import { JobPostWithOwner } from "@/lib/jobs";
import { PAY_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function JobCard({ job }: { job: JobPostWithOwner }) {
  const employerName = job.user.name?.trim() || "Работодатель";
  const employerLetter = employerName[0]?.toUpperCase() ?? "Р";

  return (
    <Card className="group surface flex h-full flex-col space-y-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary font-semibold text-foreground">{employerLetter}</span>
        <span className="truncate">{employerName}</span>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/jobs/${job.id}`} className="font-semibold leading-5 hover:text-primary hover:underline">
            {job.title}
          </Link>
          <p className="mt-0.5 text-sm text-muted-foreground">{job.category}</p>
        </div>

        <div className="text-right text-sm">
          <div className="font-medium">{job.payType === "NEGOTIABLE" ? "Договорная" : `${job.payValue ?? "-"} RUB`}</div>
          <div className="text-xs text-muted-foreground">{PAY_TYPE_LABELS[job.payType]}</div>
        </div>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>

      <div className="mt-auto flex flex-wrap gap-2">
        {job.urgentToday && <Badge className="bg-amber-100 text-amber-800">Срочно</Badge>}
        <Badge>{job.district ? `Район: ${job.district}` : "Дербент"}</Badge>
      </div>
    </Card>
  );
}
