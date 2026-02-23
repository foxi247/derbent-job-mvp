import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RoleSelector } from "@/components/forms/role-selector";

export default async function RolePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-md surface space-y-4 p-6">
      <h1 className="text-xl font-semibold">Выберите роль</h1>
      <p className="text-sm text-muted-foreground">
        Исполнитель размещает анкету и получает отклики. Работодатель публикует задания и ищет людей.
      </p>
      <RoleSelector currentRole={session.user.role} />
    </div>
  );
}

