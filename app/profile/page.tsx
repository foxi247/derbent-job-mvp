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
        <p className="mt-1 text-sm text-muted-foreground">Заполните данные для публикации анкеты или заданий.</p>
      </div>

      <ProfileForm
        role={session.user.role}
        initial={{
          about: profile?.about ?? "",
          gender: profile?.gender ?? null,
          age: profile?.age ?? null,
          workCategory: profile?.workCategory ?? "",
          previousWork: profile?.previousWork ?? "",
          experienceYears: profile?.experienceYears ?? 0,
          skills: (profile?.skills ?? []).join(", "),
          availability: profile?.availability ?? "",
          phone: profile?.phone ?? ""
        }}
      />
    </div>
  );
}
