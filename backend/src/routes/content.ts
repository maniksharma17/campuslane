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
router.get('/classes', requireAnyAuth, ContentController.getClasses);
router.post('/classes', requireAdminAuth, validateBody(createClassSchema), ContentController.createClass);
router.patch('/classes/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateClassSchema), ContentController.updateClass);
router.delete('/classes/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteClass);

// Subjects
router.get('/subjects', requireAnyAuth, validateQuery(paginationSchema.extend({ classId: mongoIdSchema.optional() })), ContentController.getSubjects);
router.post('/subjects', requireAdminAuth, validateBody(createSubjectSchema), ContentController.createSubject);
router.patch('/subjects/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateSubjectSchema), ContentController.updateSubject);
router.delete('/subjects/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteSubject);

// Chapters
router.get('/chapters', requireAnyAuth, validateQuery(paginationSchema.extend({ subjectId: mongoIdSchema.optional() })), ContentController.getChapters);
router.post('/chapters', requireAdminAuth, validateBody(createChapterSchema), ContentController.createChapter);
router.patch('/chapters/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateChapterSchema), ContentController.updateChapter);
router.delete('/chapters/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteChapter);

// Content
router.get('/content', requireAnyAuth, validateQuery(paginationSchema.extend({
  classId: mongoIdSchema.optional(),
  subjectId: mongoIdSchema.optional(),
  chapterId: mongoIdSchema.optional(),
  type: z.enum(['file', 'video', 'quiz', 'game']).optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
})), ContentController.getContent);

router.get('/content/:id', requireAnyAuth, validateParams(z.object({ id: mongoIdSchema })), ContentController.getContentById);

router.post('/content', requireAnyAuth, validateBody(createContentSchema), ContentController.createContent);

router.patch('/content/:id', requireAnyAuth, requireTeacherApproval, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateContentSchema), ContentController.updateContent);

router.delete('/content/:id', requireAnyAuth, requireTeacherApproval, validateParams(z.object({ id: mongoIdSchema })), ContentController.deleteContent);

export default router;