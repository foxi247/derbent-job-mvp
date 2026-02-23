import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Пользовательское соглашение",
  description: "Правила использования платформы",
  alternates: {
    canonical: `${getBaseUrl()}/terms`
  }
};

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Пользовательское соглашение</h1>
      </section>

      <section className="surface space-y-3 p-5 text-sm text-muted-foreground">
        <p>Пользователь несет ответственность за достоверность данных в профиле и объявлениях.</p>
        <p>Запрещены спам, мошенничество, публикация ссылок и оскорбительный контент.</p>
        <p>Администратор вправе снять публикацию с показа и ограничить аккаунт при нарушениях.</p>
      </section>
    </div>
  );
}
