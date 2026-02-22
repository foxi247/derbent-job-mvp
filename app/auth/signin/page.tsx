import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignInClient } from "@/components/forms/signin-client";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-md surface p-6">
      <h1 className="text-xl font-semibold">Вход в сервис</h1>
      <p className="mt-2 text-sm text-muted-foreground">Email magic link, Google, Yandex или демо-вход.</p>
      <div className="mt-4">
        <SignInClient />
      </div>
    </div>
  );
}