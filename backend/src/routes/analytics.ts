import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { requireAuth, requireRole, requireAdminAuth, requireTeacherApproval } from '../middleware/auth';

const router = Router();

// Admin analytics
router.get('/admin/users', requireAdminAuth, AnalyticsController.getAdminUserAnalytics);
router.get('/admin/content', requireAdminAuth, AnalyticsController.getAdminContentAnalytics);
router.get('/admin/engagement', requireAdminAuth, AnalyticsController.getAdminEngagementAnalytics);
router.get('/admin/sales', requireAdminAuth, AnalyticsController.getAdminSalesAnalytics);

// Teacher analytics
router.get('/teacher/overview', requireAuth, requireRole('teacher'), requireTeacherApproval, AnalyticsController.getTeacherAnalytics);

export default router;