import { z } from "zod";
import mongoose from "mongoose"; 

export const googleSignInSchema = z
  .object({
    idToken: z.string().min(1, "ID token is required"),
    role: z.enum(["student", "teacher", "parent"]).optional(),
    age: z.number().min(5).max(18).optional(),
    phone: z.string().optional(),
    name: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
    classLevel: z.custom<mongoose.Schema.Types.ObjectId>().optional(), 
    classOther: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student") {
      // Age must be present
      if (data.age === undefined || data.age === null) {
        ctx.addIssue({
          path: ["age"],
          code: "custom",
          message: "Age is required for students",
        });
      }

      // At least one of classLevel or classOther must be present
      if (!data.classLevel && !data.classOther) {
        ctx.addIssue({
          path: ["classLevel"],
          code: "custom",
          message: "Either classLevel or classOther is required for students",
        });
        ctx.addIssue({
          path: ["classOther"],
          code: "custom",
          message: "Either classLevel or classOther is required for students",
        });
      }
    }
  });


export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});