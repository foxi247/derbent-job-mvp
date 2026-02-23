import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "EXECUTOR" | "EMPLOYER" | "ADMIN";
      balanceRub: number;
      isBanned: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: "EXECUTOR" | "EMPLOYER" | "ADMIN";
    balanceRub?: number;
    isBanned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "EXECUTOR" | "EMPLOYER" | "ADMIN";
    balanceRub?: number;
    isBanned?: boolean;
  }
}

