"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInClient() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [info, setInfo] = useState("");

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setInfo("");

    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/auth/role"
    });

    if (result?.ok) {
      setInfo("Проверьте email: отправили ссылку для входа.");
    } else {
      setInfo("Не удалось отправить ссылку.");
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onEmail} className="space-y-2">
        <Input
          type="email"
          required
          placeholder="Ваш email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button className="w-full" type="submit" disabled={isPending}>
          Войти по email
        </Button>
      </form>

      <Button
        className="w-full"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => signIn("google", { callbackUrl: "/auth/role" }))}
      >
        Продолжить через Google
      </Button>

      <Button
        className="w-full"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => signIn("yandex", { callbackUrl: "/auth/role" }))}
      >
        Продолжить через Yandex
      </Button>

      <Button
        className="w-full"
        variant="ghost"
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            signIn("demo", {
              email: "demo.executor@local.test",
              role: "EXECUTOR",
              callbackUrl: "/dashboard"
            })
          )
        }
      >
        Демо вход (исполнитель)
      </Button>

      <Button
        className="w-full"
        variant="ghost"
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            signIn("demo", {
              email: "demo.employer@local.test",
              role: "EMPLOYER",
              callbackUrl: "/"
            })
          )
        }
      >
        Демо вход (работодатель)
      </Button>

      {info && <p className="text-sm text-muted-foreground">{info}</p>}
    </div>
  );
}