import { z } from 'zod';

export const googleSignInSchema = z
  .object({
    idToken: z.string().min(1, "ID token is required"),
    role: z.enum(["student", "teacher", "parent"]).optional(),
    age: z.number().min(5).max(18).optional(),
    phone: z.string(),
    name: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    pincode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student" && (data.age === undefined || data.age === null)) {
      ctx.addIssue({
        path: ["age"],
        code: "custom",
        message: "Age is required for students",
      });
    }
  });

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});