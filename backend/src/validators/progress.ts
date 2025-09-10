import { z } from 'zod';

export const openContentSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
});

/**
 * Used when student finishes content
 * - Allows optional quizScore (for quizzes)
 * - Forces valid range
 */
export const completeContentSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  quizScore: z.number().min(0).max(100).optional(),
});

/**
 * Ping request when student is watching video
 * - Should be called every 15s
 * - We limit increments to 5 minutes (anti-cheat)
 */
export const videoPingSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  secondsSinceLastPing: z
    .number()
    .min(1, 'Must be greater than 0 seconds')
    .max(300, 'Ping increment too large'),
});
