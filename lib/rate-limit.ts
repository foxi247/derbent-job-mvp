import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type MemoryWindow = {
  hits: number;
  resetAt: number;
  windowStart: number;
};

type RateLimitOptions = {
  action: string;
  key: string;
  limit: number;
  windowMs: number;
  userId?: string | null;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const globalStore = globalThis as unknown as {
  __rateLimitMemory__?: Map<string, MemoryWindow>;
};

function getStore() {
  if (!globalStore.__rateLimitMemory__) {
    globalStore.__rateLimitMemory__ = new Map<string, MemoryWindow>();
  }

  return globalStore.__rateLimitMemory__;
}

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}

export function buildRateLimitKey(req: NextRequest, userId?: string | null) {
  const ip = getClientIp(req);
  return userId ? `user:${userId}:${ip}` : `ip:${ip}`;
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const namespacedKey = `${options.action}:${options.key}`;
  const store = getStore();

  const existing = store.get(namespacedKey);
  if (!existing || existing.resetAt <= now) {
    const nextWindow: MemoryWindow = {
      hits: 1,
      resetAt: now + options.windowMs,
      windowStart: now
    };

    store.set(namespacedKey, nextWindow);

    void prisma.rateLimitLog
      .create({
        data: {
          userId: options.userId ?? null,
          action: options.action,
          key: options.key,
          hits: 1,
          windowStart: new Date(nextWindow.windowStart)
        }
      })
      .catch(() => undefined);

    return {
      ok: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000)
    };
  }

  existing.hits += 1;
  store.set(namespacedKey, existing);

  void prisma.rateLimitLog
    .create({
      data: {
        userId: options.userId ?? null,
        action: options.action,
        key: options.key,
        hits: existing.hits,
        windowStart: new Date(existing.windowStart)
      }
    })
    .catch(() => undefined);

  const remaining = Math.max(0, options.limit - existing.hits);
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    ok: existing.hits <= options.limit,
    remaining,
    retryAfterSeconds
  };
}
