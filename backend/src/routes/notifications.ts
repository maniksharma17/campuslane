import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { requireAdminAuth, requireAuth } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validation';
import { mongoIdSchema, paginationSchema } from '../validators/common';
import { z } from 'zod';

const router = Router();

router.get('/', requireAdminAuth, validateQuery(paginationSchema), NotificationController.getNotifications);
router.patch('/:id/read', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), NotificationController.markAsRead);
router.delete('/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), NotificationController.deleteNotification);

export default router;