import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Как это работает",
  description: "Простой сценарий работы сервиса для исполнителей и работодателей",
  alternates: {
    canonical: `${getBaseUrl()}/how-it-works`
  }
};

export default function HowItWorksPage() {
  return (
    <div className="space-y-6">
      <section className="surface p-5">
        <h1 className="text-2xl font-semibold">Как это работает</h1>
        <p className="mt-1 text-sm text-muted-foreground">Сервис пока работает только для города Дербент.</p>
      </section>

      <section className="surface space-y-4 p-5 text-sm">
        <div>
          <h2 className="font-semibold">Исполнитель</h2>
          <p className="mt-1 text-muted-foreground">Зарегистрируйтесь, заполните профиль, опубликуйте анкету по тарифу и получайте отклики.</p>
        </div>
        <div>
          <h2 className="font-semibold">Работодатель</h2>
          <p className="mt-1 text-muted-foreground">Создайте задание, выберите тариф и принимайте отклики подходящих исполнителей.</p>
        </div>
        <div>
          <h2 className="font-semibold">Безопасность</h2>
          <p className="mt-1 text-muted-foreground">Есть жалобы, блокировки пользователей и ручная модерация пополнений.</p>
        </div>
      </section>
    </div>
  );
}
