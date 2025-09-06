import { z } from 'zod';

export const openContentSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
});

export const completeContentSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  quizScore: z.number().min(0).max(100).optional(),
});

export const videoPingSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  secondsSinceLastPing: z.number().min(0).max(300, 'Invalid time increment'),
});