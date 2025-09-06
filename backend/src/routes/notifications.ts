import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { requireAuth } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validation';
import { mongoIdSchema, paginationSchema } from '../validators/common';
import { z } from 'zod';

const router = Router();

router.get('/', requireAuth, validateQuery(paginationSchema), NotificationController.getNotifications);
router.patch('/:id/read', requireAuth, validateParams(z.object({ id: mongoIdSchema })), NotificationController.markAsRead);
router.delete('/:id', requireAuth, validateParams(z.object({ id: mongoIdSchema })), NotificationController.deleteNotification);

export default router;