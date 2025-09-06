import { z } from 'zod';

export const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  sort: z.string().optional(),
  dir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  includeDeleted: z.string().transform(val => val === 'true').default('false'),
});

export const presignSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  contentType: z.string().min(1, 'Content type is required'),
  fileSize: z.number().max(300 * 1024 * 1024, 'File size must be less than 300MB'),
});