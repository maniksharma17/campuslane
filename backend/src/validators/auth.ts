import { z } from 'zod';

export const googleSignInSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  role: z.enum(['student', 'teacher', 'parent']).optional(),
  age: z.number().min(5).max(18).optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});