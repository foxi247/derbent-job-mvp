import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationsBellProps = {
  unreadCount: number;
  className?: string;
};

export function NotificationsBell({ unreadCount, className }: NotificationsBellProps) {
  return (
    <Link
      href="/notifications"
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white text-muted-foreground transition hover:bg-secondary hover:text-foreground",
        className
      )}
      aria-label="Уведомления"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-5 text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

