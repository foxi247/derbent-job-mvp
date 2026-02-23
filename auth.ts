import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Email from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

type AppRole = "EXECUTOR" | "EMPLOYER" | "ADMIN";

const yandexProvider = {
  id: "yandex",
  name: "Yandex",
  type: "oauth",
  clientId: process.env.YANDEX_CLIENT_ID,
  clientSecret: process.env.YANDEX_CLIENT_SECRET,
  authorization: "https://oauth.yandex.ru/authorize?scope=login:email+login:info",
  token: "https://oauth.yandex.ru/token",
  userinfo: "https://login.yandex.ru/info?format=json",
  profile(profile: Record<string, unknown>) {
    const avatarId = profile.default_avatar_id as string | undefined;
    return {
      id: String(profile.id),
      name: (profile.real_name as string) ?? (profile.display_name as string) ?? null,
      email: (profile.default_email as string) ?? null,
      image: avatarId ? `https://avatars.yandex.net/get-yapic/${avatarId}/islands-200` : null
    };
  }
};

function normalizeRole(value: unknown): AppRole {
  if (value === "ADMIN") return "ADMIN";
  if (value === "EMPLOYER") return "EMPLOYER";
  return "EXECUTOR";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {
        email: { label: "Email", type: "email" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (process.env.NODE_ENV === "production") {
          return null;
        }

        const email =
          typeof credentials?.email === "string" && credentials.email.length > 3
            ? credentials.email
            : "demo.executor@local.test";

        const requestedRole = normalizeRole(credentials?.role);
        let effectiveRole: AppRole = requestedRole;

        let user: any;
        try {
          user = await (prisma as any).user.upsert({
            where: { email },
            update: { role: effectiveRole },
            create: {
              email,
              role: effectiveRole,
              name:
                effectiveRole === "EXECUTOR"
                  ? "Демо исполнитель"
                  : effectiveRole === "ADMIN"
                    ? "Демо администратор"
                    : "Демо работодатель"
            }
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "";

          if (requestedRole === "ADMIN" && message.includes("Invalid value for argument `role`")) {
            // Совместимость: если enum ADMIN еще не применен в БД, даем войти как EMPLOYER.
            effectiveRole = "EMPLOYER";
            user = await (prisma as any).user.upsert({
              where: { email },
              update: { role: effectiveRole },
              create: {
                email,
                role: effectiveRole,
                name: "Демо работодатель"
              }
            });
          } else {
            throw error;
          }
        }

        if (effectiveRole === "EXECUTOR") {
          await (prisma as any).profile.upsert({
            where: { userId: user.id },
            update: {},
            create: {
              userId: user.id,
              city: "DERBENT",
              about: "Демо профиль для локального входа",
              experienceYears: 2,
              skills: ["Коммуникация", "Ответственность"],
              availability: "Ежедневно, по договоренности",
              phone: "+7 900 000-00-00",
              isOnline: true,
              urgentToday: false
            }
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          balanceRub: user.balanceRub ?? 0,
          isBanned: user.isBanned ?? false
        };
      }
    }),
    yandexProvider as any
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "EMPLOYER";
        token.balanceRub = (user as { balanceRub?: number }).balanceRub ?? 0;
        token.isBanned = (user as { isBanned?: boolean }).isBanned ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = token.sub ?? "";

      let dbUser: { role?: AppRole; balanceRub?: number; isBanned?: boolean } | null = null;

      if (token.sub) {
        try {
          dbUser = await (prisma as any).user.findUnique({
            where: { id: token.sub },
            select: { role: true, balanceRub: true, isBanned: true }
          });
        } catch {
          const fallbackUser = await (prisma as any).user.findUnique({
            where: { id: token.sub },
            select: { role: true }
          });

          dbUser = fallbackUser
            ? {
                role: fallbackUser.role,
                balanceRub: 0,
                isBanned: false
              }
            : null;
        }
      }

      session.user.role =
        (dbUser?.role as "EXECUTOR" | "EMPLOYER" | "ADMIN" | undefined) ??
        (token.role as "EXECUTOR" | "EMPLOYER" | "ADMIN") ??
        "EMPLOYER";
      session.user.balanceRub = dbUser?.balanceRub ?? (token.balanceRub as number) ?? 0;
      session.user.isBanned = dbUser?.isBanned ?? (token.isBanned as boolean) ?? false;

      return session;
    }
  }
});
