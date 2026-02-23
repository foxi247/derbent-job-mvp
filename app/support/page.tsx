import type { Metadata } from "next";
import { SupportForm } from "@/components/forms/support-form";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Поддержка",
  description: "Контакты поддержки и форма обращения",
  alternates: {
    canonical: `${getBaseUrl()}/support`
  }
};

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Поддержка</h1>
        <p className="mt-1 text-sm text-muted-foreground">По вопросам сервиса: support@derbent-job.local</p>
      </section>

      <SupportForm />
    </div>
  );
}
