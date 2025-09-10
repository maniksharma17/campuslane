import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  thumbnailKey: z.string()
});

export const updateClassSchema = createClassSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  description: z.string().optional(),
  classId: z.string().min(1, 'Class ID is required'),
  thumbnailKey: z.string()
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const createChapterSchema = z.object({
  name: z.string().min(1, 'Chapter name is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Subject ID is required'),
  order: z.number().int().min(0).default(0),
  thumbnailKey: z.string()
});

export const updateChapterSchema = createChapterSchema.partial();


export const createContentSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    classId: z.string().min(1, "Class ID is required"),
    subjectId: z.string().min(1, "Subject ID is required"),
    chapterId: z.string().min(1, "Chapter ID is required"),
    type: z.enum(["file", "video", "quiz", "game", "image"]),

    s3Key: z.string().optional(),
    thumbnailKey: z.string(),
    fileUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),

    // ✅ Accept null but normalize to undefined
    duration: z.number().nullable().transform((val) => val ?? undefined),
    fileSize: z.number().nullable().transform((val) => val ?? undefined),

    quizType: z.enum(["googleForm", "native"]).optional(),
    googleFormUrl: z.string().url().optional(),

    tags: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    // Require s3Key for non-quiz content
    if (data.type !== "quiz" && !data.s3Key) {
      ctx.addIssue({
        path: ["s3Key"],
        code: z.ZodIssueCode.custom,
        message: "s3Key is required for non-quiz content",
      });
    }

    // Require quizType for quizzes
    if (data.type === "quiz" && !data.quizType) {
      ctx.addIssue({
        path: ["quizType"],
        code: z.ZodIssueCode.custom,
        message: "quizType is required for quiz content",
      });
    }

    // Require duration + fileSize for videos
    if (data.type === "video") {
      if (data.duration === undefined) {
        ctx.addIssue({
          path: ["duration"],
          code: z.ZodIssueCode.custom,
          message: "duration is required for video content",
        });
      }
      if (data.fileSize === undefined) {
        ctx.addIssue({
          path: ["fileSize"],
          code: z.ZodIssueCode.custom,
          message: "fileSize is required for video content",
        });
      }
    }
  });

const contentBase = createContentSchema._def.schema; 
export const updateContentSchema = contentBase.partial();
