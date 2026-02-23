import { NextResponse } from "next/server";
import { ZodError } from "zod";

type ApiErrorOptions = {
  code?: string;
  details?: unknown;
  headers?: HeadersInit;
  noStore?: boolean;
};

type JsonOptions = {
  status?: number;
  headers?: HeadersInit;
  noStore?: boolean;
};

function mergeHeaders(headers: HeadersInit | undefined, noStore: boolean) {
  const result = new Headers(headers);
  if (noStore) {
    result.set("Cache-Control", "no-store, max-age=0");
  }
  return result;
}

export function jsonResponse<T>(data: T, options?: JsonOptions) {
  return NextResponse.json(data, {
    status: options?.status ?? 200,
    headers: mergeHeaders(options?.headers, options?.noStore ?? false)
  });
}

export function apiError(message: string, status = 400, options?: ApiErrorOptions) {
  return NextResponse.json(
    {
      error: message,
      code: options?.code ?? "API_ERROR",
      details: options?.details ?? null
    },
    {
      status,
      headers: mergeHeaders(options?.headers, options?.noStore ?? false)
    }
  );
}

export function apiValidationError(error: ZodError, message = "Некорректные входные данные") {
  return apiError(message, 400, {
    code: "VALIDATION_ERROR",
    details: error.flatten()
  });
}

export function extractApiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const maybeMessage = (payload as { error?: unknown }).error;
  if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
    return maybeMessage;
  }

  return fallback;
}

