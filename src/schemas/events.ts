import { z } from "zod";

export const EventSchema = z.object({
  createdAt: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  description: z.string(),
  id: z.string().cuid().optional(),
  eventCreatedById: z.string().cuid().optional(),
  location: z.object({
    longitude: z.number(),
    latitude: z.number(),
    name: z.string().optional(),
  }),
  mapData: z.object({
    longitude: z.number(),
    latitude: z.number(),
    longitudeDelta: z.number(),
    latitudeDelta: z.number(),
  }),
  photos: z.array(
    z.object({
      url: z.string().url(),
      name: z.string(),
    })
  ),
  price: z.number().nonnegative(),
  title: z.string(),
  updatedAt: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  categories: z.array(z.string()).optional(), // Add this line to accommodate categories
});
