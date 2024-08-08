import { z } from "zod";

export const BookingSchema = z.object({
  id: z.string().cuid().optional(),
  createdAt: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  updatedAt: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  userId: z.string().cuid(),
  eventId: z.string().cuid(),
  status: z.string(),
});
