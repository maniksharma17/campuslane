import { z } from 'zod';

export const createParentChildLinkSchema = z.object({
  childId: z.string().optional(),
  studentCode: z.string().optional(),
}).refine(
  (data) => data.childId || data.studentCode,
  {
    message: 'Either childId or studentCode is required',
    path: ['childId'],
  }
);

export const respondToLinkSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});