import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/forms/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });

  return (
    <div className="space-y-4">
      <div className="surface p-5">
        <h1 className="text-2xl font-semibold">Профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Настройте информацию о себе и добавьте телефон для безопасного показа по кнопке.
        </p>
      </div>

      <ProfileForm
        initial={{
          about: profile?.about ?? "",
          experienceYears: profile?.experienceYears ?? 0,
          skills: (profile?.skills ?? []).join(", "),
          availability: profile?.availability ?? "",
          phone: profile?.phone ?? ""
        }}
      />
    </div>
  );
}
