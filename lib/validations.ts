import { z } from "zod";

const nullablePrice = z.number().nonnegative().nullable();

export const listingSchema = z.object({
  title: z.string().min(5).max(120),
  category: z.string().min(2).max(60),
  description: z.string().min(20).max(2000),
  priceType: z.enum(["PER_SQM", "PER_HOUR", "FIXED", "NEGOTIABLE"]),
  priceValue: nullablePrice,
  district: z.string().max(120).optional().nullable(),
  status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE")
});

export const listingPatchSchema = listingSchema.partial();

export const jobPostSchema = z.object({
  title: z.string().min(5).max(120),
  category: z.string().min(2).max(60),
  description: z.string().min(20).max(2000),
  payType: z.enum(["PER_HOUR", "FIXED", "NEGOTIABLE"]),
  payValue: nullablePrice,
  district: z.string().max(120).optional().nullable(),
  phone: z.string().min(6).max(30).optional().nullable(),
  urgentToday: z.boolean().optional().default(false),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).default("ACTIVE")
});

export const jobPostPatchSchema = jobPostSchema.partial();

export const profileSchema = z.object({
  about: z.string().max(2000).default(""),
  experienceYears: z.number().int().min(0).max(60).default(0),
  skills: z.array(z.string().min(1).max(50)).max(30).default([]),
  availability: z.string().max(300).default(""),
  phone: z.string().min(6).max(30).optional().nullable()
});

export const experienceSchema = z.object({
  experienceYears: z.number().int().min(0).max(60)
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
    text: z.string().min(5).max(1500)
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

export const roleSchema = z.object({
  role: z.enum(["EXECUTOR", "EMPLOYER"])
});

export const listingQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  online: z.enum(["true", "false"]).optional(),
  urgent: z.enum(["true", "false"]).optional(),
  experienceMin: z.coerce.number().optional(),
  experienceMax: z.coerce.number().optional(),
  priceType: z.enum(["PER_SQM", "PER_HOUR", "FIXED", "NEGOTIABLE"]).optional()
});

export const jobQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  payType: z.enum(["PER_HOUR", "FIXED", "NEGOTIABLE"]).optional(),
  urgent: z.enum(["true", "false"]).optional()
});
