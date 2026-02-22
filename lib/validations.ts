import { z } from "zod";

export const listingSchema = z.object({
  title: z.string().min(5).max(120),
  category: z.string().min(2).max(60),
  description: z.string().min(20).max(2000),
  priceType: z.enum(["PER_SQM", "PER_HOUR", "FIXED", "NEGOTIABLE"]),
  priceValue: z.number().nonnegative().nullable(),
  district: z.string().max(120).optional().nullable(),
  status: z.enum(["ACTIVE", "PAUSED"]).default("ACTIVE")
});

export const listingPatchSchema = listingSchema.partial();

export const profileSchema = z.object({
  about: z.string().min(10).max(2000),
  experienceYears: z.number().int().min(0).max(60),
  skills: z.array(z.string().min(1).max(50)).max(30),
  availability: z.string().min(3).max(300)
});

export const experienceSchema = z.object({
  experienceYears: z.number().int().min(0).max(60)
});

export const statusSchema = z.object({
  isOnline: z.boolean().optional(),
  urgentToday: z.boolean().optional()
});

export const messageSchema = z.object({
  listingId: z.string().cuid(),
  senderName: z.string().min(2).max(120),
  senderContact: z.string().min(3).max(120),
  text: z.string().min(5).max(1500)
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

