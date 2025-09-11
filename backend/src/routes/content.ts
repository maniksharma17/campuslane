import { Router } from 'express';
import { z } from "zod";
import { ContentController } from '../controllers/ContentController';
import { requireAdminAuth, requireAnyAuth, requireAuth, requireRole, requireTeacherApproval } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { 
  createClassSchema, 
  updateClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createChapterSchema,
  updateChapterSchema,
  createContentSchema,
  updateContentSchema 
} from '../validators/content';
import { mongoIdSchema, paginationSchema } from '../validators/common';

const router = Router();

// Classes
router.get('/classes', ContentController.getClasses);
router.get('/classes/:id', ContentController.getClassById);
router.post('/classes', requireAdminAuth, validateBody(createClassSchema), ContentController.createClass);
router.patch('/classes/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateClassSchema), ContentController.updateClass);
router.delete('/classes/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteClass);

// Subjects
router.get('/subjects', validateQuery(paginationSchema.extend({ classId: mongoIdSchema.optional() })), ContentController.getSubjects);
router.get('/subjects/:id', ContentController.getSubjectById);
router.post('/subjects', requireAdminAuth, validateBody(createSubjectSchema), ContentController.createSubject);
router.patch('/subjects/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateSubjectSchema), ContentController.updateSubject);
router.delete('/subjects/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteSubject);

// Chapters
router.get('/chapters', validateQuery(paginationSchema.extend({ subjectId: mongoIdSchema.optional() })), ContentController.getChapters);
router.get('/chapters/:id', ContentController.getChapterById);
router.post('/chapters', requireAdminAuth, validateBody(createChapterSchema), ContentController.createChapter);
router.patch('/chapters/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateChapterSchema), ContentController.updateChapter);
router.delete('/chapters/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteChapter);

// Content
router.get('/content', validateQuery(paginationSchema.extend({
  classId: mongoIdSchema.optional(),
  subjectId: mongoIdSchema.optional(),
  chapterId: mongoIdSchema.optional(),
  isAdminContent: z.enum(['true', 'false']).optional(),
  type: z.enum(['file', 'video', 'quiz', 'game', 'image']).optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
})), ContentController.getContent);

// For teacher dashboard
router.get('/teacher/content', requireAnyAuth, validateQuery(paginationSchema.extend({
  classId: mongoIdSchema.optional(),
  subjectId: mongoIdSchema.optional(),
  chapterId: mongoIdSchema.optional(),
  type: z.enum(['file', 'video', 'quiz', 'game', 'image']).optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  uploaderId: mongoIdSchema.optional(),
})), ContentController.getTeacherContent);

router.get('/content/:id', requireAnyAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.getContentById);

router.post('/content', requireAnyAuth, validateBody(createContentSchema), ContentController.createContent);

router.patch('/content/:id', requireAnyAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateContentSchema), ContentController.updateContent);

router.delete('/content/:id', requireAnyAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteContent);

export default router;