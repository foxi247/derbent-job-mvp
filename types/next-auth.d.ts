import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "EXECUTOR" | "EMPLOYER";
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: "EXECUTOR" | "EMPLOYER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "EXECUTOR" | "EMPLOYER";
  }
}

