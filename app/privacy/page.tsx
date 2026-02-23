import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Как сервис обрабатывает персональные данные",
  alternates: {
    canonical: `${getBaseUrl()}/privacy`
  }
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Политика конфиденциальности</h1>
      </section>

      <section className="surface space-y-3 p-5 text-sm text-muted-foreground">
        <p>Мы храним только данные, необходимые для работы платформы: профиль, объявления, отклики, сообщения и технические логи.</p>
        <p>Телефон пользователя скрыт и показывается только авторизованным пользователям по кнопке «Показать номер».</p>
        <p>По запросу пользователя данные могут быть удалены через поддержку.</p>
      </section>
    </div>
  );
}
