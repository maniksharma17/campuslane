import { Router } from 'express';
import authRoutes from './auth';
import adminRoutes from './admin';
import contentRoutes from './content';
import progressRoutes from './progress';
import parentChildRoutes from './parentChild';
import ecommerceRoutes from './ecommerce';
import notificationRoutes from './notifications';
import analyticsRoutes from './analytics';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Campus Lane API is running',
    timestamp: new Date().toISOString(),
  });
});

// Route mounting
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/', contentRoutes); // Classes, subjects, chapters, content
router.use('/progress', progressRoutes);
router.use('/parent', parentChildRoutes);
router.use('/student', parentChildRoutes);
router.use('/', ecommerceRoutes); // E-commerce routes
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;