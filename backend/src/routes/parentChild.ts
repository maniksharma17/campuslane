import { Router } from 'express';
import { ParentChildController } from '../controllers/ParentChildController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { createParentChildLinkSchema } from '../validators/parentChild';
import { mongoIdSchema } from '../validators/common';
import { z } from 'zod';

const router = Router();

// Parent routes
router.post('/links', requireAuth, requireRole('parent'), validateBody(createParentChildLinkSchema), ParentChildController.createLink);
router.get('/links', requireAuth, requireRole('parent'), ParentChildController.getParentLinks);

// Student routes
router.get('/links/pending', requireAuth, requireRole('student'), ParentChildController.getPendingLinks);
router.patch('/links/:id/approve', requireAuth, requireRole('student'), validateParams(z.object({ id: mongoIdSchema })), ParentChildController.approveLink);
router.patch('/links/:id/reject', requireAuth, requireRole('student'), validateParams(z.object({ id: mongoIdSchema })), ParentChildController.rejectLink);
router.delete('/links/:id', requireAuth, requireRole('student'), validateParams(z.object({ id: mongoIdSchema })), ParentChildController.deleteLink);

export default router;