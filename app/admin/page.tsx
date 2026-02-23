import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminPanel } from "@/components/admin/admin-panel";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminPanel />;
}
