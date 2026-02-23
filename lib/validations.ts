import { z } from "zod";

const nullableMoney = z.number().nonnegative().nullable();
const hasLinkPattern = /(https?:\/\/|www\.)/i;

function textWithoutLinks(value: string) {
  return !hasLinkPattern.test(value);
}

function safeText(min: number, max: number) {
  return z
    .string()
    .min(min)
    .max(max)
    .refine(textWithoutLinks, { message: "Ссылки в тексте запрещены" });
}

export const listingSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.string().min(2).max(60),
  description: safeText(10, 2000),
  priceType: z.enum(["PER_SQM", "PER_HOUR", "FIXED", "NEGOTIABLE"]),
  priceValue: nullableMoney,
  district: z.string().max(120).optional().nullable(),
  status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
  tariffPlanId: z.string().cuid().optional().nullable()
});

export const listingPatchSchema = listingSchema.partial();

export const jobPostSchema = z.object({
  title: z.string().min(3).max(120),
  category: z.string().min(2).max(60),
  description: safeText(10, 2000),
  payType: z.enum(["PER_HOUR", "FIXED", "NEGOTIABLE"]),
  payValue: nullableMoney,
  district: z.string().max(120).optional().nullable(),
  phone: z.string().min(6).max(30).optional().nullable(),
  urgentToday: z.boolean().optional().default(false),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).default("PAUSED"),
  tariffPlanId: z.string().cuid().optional().nullable()
});

export const jobPostPatchSchema = jobPostSchema.partial();

export const profileSchema = z.object({
  about: z.string().max(2000).default(""),
  gender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  age: z.number().int().min(14).max(90).optional().nullable(),
  workCategory: z.string().max(60).optional().nullable(),
  previousWork: z.string().max(200).optional().nullable(),
  experienceYears: z.number().int().min(0).max(60).default(0),
  skills: z.array(z.string().min(1).max(50)).max(30).default([]),
  availability: z.string().max(300).default(""),
  phone: z.string().min(6).max(30).optional().nullable()
});

export const statusSchema = z.object({
  isOnline: z.boolean().optional(),
  urgentToday: z.boolean().optional()
});

export const messageSchema = z
  .object({
    listingId: z.string().cuid().optional(),
    jobPostId: z.string().cuid().optional(),
    senderName: z.string().min(2).max(120),
    senderContact: z.string().min(3).max(120),
    text: safeText(5, 1500)
  })
  .refine((value) => Number(Boolean(value.listingId)) + Number(Boolean(value.jobPostId)) === 1, {
    message: "Нужно указать либо listingId, либо jobPostId"
  });

export const reviewSchema = z.object({
  jobPostId: z.string().cuid(),
  executorUserId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1200).optional().nullable()
});

export const contactRevealSchema = z
  .object({
    listingId: z.string().cuid().optional(),
    jobPostId: z.string().cuid().optional()
  })
  .refine((value) => Number(Boolean(value.listingId)) + Number(Boolean(value.jobPostId)) === 1, {
    message: "Нужно указать либо listingId, либо jobPostId"
  });

export const roleChoiceSchema = z.object({
  role: z.enum(["EXECUTOR", "EMPLOYER"])
});

export const listingQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  online: z.enum(["true", "false"]).optional(),
  urgent: z.enum(["true", "false"]).optional(),
  experienceMin: z.coerce.number().optional(),
  experienceMax: z.coerce.number().optional(),
  priceType: z.enum(["PER_SQM", "PER_HOUR", "FIXED", "NEGOTIABLE"]).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  offset: z.coerce.number().int().min(0).max(20_000).optional()
});

export const jobQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  payType: z.enum(["PER_HOUR", "FIXED", "NEGOTIABLE"]).optional(),
  urgent: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  offset: z.coerce.number().int().min(0).max(20_000).optional()
});

export const topUpCreateSchema = z.object({
  amountRub: z.number().int().min(100).max(500000)
});

export const topUpConfirmSchema = z.object({
  proofText: z.string().max(300).optional().nullable()
});

export const topUpAdminActionSchema = z.object({
  adminNote: z.string().max(500).optional().nullable()
});

export const topUpQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]).optional()
});

export const adminSettingsSchema = z.object({
  bankName: z.string().min(2).max(100),
  cardNumber: z.string().max(40).optional().nullable(),
  phoneNumber: z.string().max(30).optional().nullable(),
  recipientName: z.string().min(2).max(100),
  instructions: z.string().min(5).max(1200)
});

export const tariffCreateSchema = z.object({
  name: z.string().min(2).max(100),
  priceRub: z.number().int().min(0).max(1_000_000),
  durationDays: z.number().int().min(1).max(365),
  kind: z.enum(["BASIC", "PREMIUM", "GOLD"]),
  discountPercent: z.number().int().min(0).max(90).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000).default(0)
});

export const tariffPatchSchema = tariffCreateSchema.partial();

export const banUserSchema = z.object({
  isBanned: z.boolean()
});

export const publicationTariffSchema = z.object({
  tariffPlanId: z.string().cuid()
});

export const adminUserQuerySchema = z.object({
  query: z.string().optional(),
  role: z.enum(["EXECUTOR", "EMPLOYER", "ADMIN"]).optional(),
  isBanned: z.enum(["true", "false"]).optional()
});

export const adminTopUpQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]).optional()
});

export const jobApplicationCreateSchema = z.object({
  message: z
    .string()
    .max(600)
    .optional()
    .nullable()
    .refine((value) => (value ? textWithoutLinks(value) : true), {
      message: "Ссылки в сообщении запрещены"
    })
});

export const jobApplicationStatusSchema = z.object({
  status: z.enum(["VIEWED", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELED"])
});

export const jobApplicationQuerySchema = z.object({
  scope: z.enum(["executor", "employer"]).optional(),
  status: z.enum(["SENT", "VIEWED", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELED"]).optional()
});

export const favoriteMutationSchema = z
  .object({
    targetType: z.enum(["LISTING", "JOB"]),
    listingId: z.string().cuid().optional(),
    jobPostId: z.string().cuid().optional()
  })
  .refine((value) => Number(Boolean(value.listingId)) + Number(Boolean(value.jobPostId)) === 1, {
    message: "Нужно указать либо listingId, либо jobPostId"
  })
  .refine(
    (value) =>
      (value.targetType === "LISTING" && Boolean(value.listingId)) ||
      (value.targetType === "JOB" && Boolean(value.jobPostId)),
    { message: "targetType не соответствует переданному объекту" }
  );

export const favoriteQuerySchema = z.object({
  targetType: z.enum(["LISTING", "JOB"]).optional()
});

export const savedSearchCreateSchema = z.object({
  type: z.enum(["LISTING", "JOB"]),
  queryParams: z.record(z.string(), z.string())
});

export const notificationQuerySchema = z.object({
  unreadOnly: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(20_000).optional()
});

export const reviewQuerySchema = z.object({
  executorUserId: z.string().cuid().optional(),
  jobPostId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).max(20_000).optional()
});

export const reportCreateSchema = z
  .object({
    targetType: z.enum(["LISTING", "JOB", "USER"]),
    listingId: z.string().cuid().optional(),
    jobPostId: z.string().cuid().optional(),
    targetUserId: z.string().cuid().optional(),
    reason: z.string().min(2).max(120),
    text: safeText(3, 1000).optional().nullable()
  })
  .refine(
    (value) =>
      (value.targetType === "LISTING" && Boolean(value.listingId)) ||
      (value.targetType === "JOB" && Boolean(value.jobPostId)) ||
      (value.targetType === "USER" && Boolean(value.targetUserId)),
    { message: "Неверная цель жалобы" }
  );

export const adminReportQuerySchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"]).optional()
});

export const adminResolveReportSchema = z.object({
  status: z.enum(["OPEN", "RESOLVED"]).default("RESOLVED"),
  banTargetUser: z.boolean().optional().default(false),
  pauseTargetPublication: z.boolean().optional().default(false)
});

export const supportRequestSchema = z.object({
  name: z.string().min(2).max(120),
  contact: z.string().min(3).max(120),
  text: safeText(10, 1200)
});
