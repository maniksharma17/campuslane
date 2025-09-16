import { Router } from 'express';
import { EcommerceController } from '../controllers/EcommerceController';
import { requireAuth, requireAdminAuth, requireAnyAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { 
  createSchoolSchema,
  updateSchoolSchema,
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  addToCartSchema,
  updateCartItemSchema,
  checkoutSchema,
  createReviewSchema,
  updateReviewSchema
} from '../validators/ecommerce';
import { mongoIdSchema, paginationSchema } from '../validators/common';
import { z } from 'zod';

const router = Router();

// Schools (admin only)
router.get('/schools', requireAdminAuth, validateQuery(paginationSchema), EcommerceController.getSchools);
router.post('/schools', requireAdminAuth, validateBody(createSchoolSchema), EcommerceController.createSchool);
router.patch('/schools/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateSchoolSchema), EcommerceController.updateSchool);
router.delete('/schools/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), EcommerceController.deleteSchool);

// Categories (admin only)
router.get('/categories', validateQuery(paginationSchema), EcommerceController.getCategories);
router.post('/categories', requireAdminAuth, validateBody(createCategorySchema), EcommerceController.createCategory);
router.patch('/categories/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateCategorySchema), EcommerceController.updateCategory);
router.delete('/categories/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), EcommerceController.deleteCategory);

// Products
router.get('/products', validateQuery(paginationSchema.extend({
  category: mongoIdSchema.optional(),
  school: mongoIdSchema.optional(),
  isActive: z.string().optional(),
  brand: z.string().optional(),
  gender: z.string().optional(),
  subject: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  inStock: z.string().optional(),
})), EcommerceController.getProducts);

router.get('/products/:id', validateParams(z.object({ id: mongoIdSchema })), EcommerceController.getProductById);
router.post('/products', requireAdminAuth, validateBody(createProductSchema), EcommerceController.createProduct);
router.patch('/products/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateProductSchema), EcommerceController.updateProduct);
router.delete('/products/:id', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), EcommerceController.deleteProduct);

// Cart
router.get('/cart', requireAuth, EcommerceController.getCart);
router.post('/cart/items', requireAuth, validateBody(addToCartSchema), EcommerceController.addToCart);
router.patch('/cart/items/:itemId', requireAuth, validateParams(z.object({ itemId: mongoIdSchema })), validateBody(updateCartItemSchema), EcommerceController.updateCartItem);
router.delete('/cart/items/:itemId', requireAuth, validateParams(z.object({ itemId: mongoIdSchema })), EcommerceController.removeCartItem);
router.delete('/cart', requireAuth, EcommerceController.clearCart);

// Orders
router.post('/orders/checkout', requireAuth, validateBody(checkoutSchema), EcommerceController.checkout);
router.post('/orders/reorder/:orderId', requireAuth, validateParams(z.object({ orderId: mongoIdSchema })), EcommerceController.reorder);
router.get('/admin/orders', requireAdminAuth, validateQuery(paginationSchema), EcommerceController.getOrders);
router.get('/orders/mine', requireAuth, validateQuery(paginationSchema), EcommerceController.getMyOrders);
router.get('/orders/:id', requireAnyAuth, validateParams(z.object({ id: mongoIdSchema })), EcommerceController.getOrderById);
router.patch('/orders/:id/cancel', requireAuth, validateParams(z.object({ id: mongoIdSchema })), EcommerceController.cancelOrder);

// Admin order management
router.patch('/admin/orders/:id/status', requireAdminAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(z.object({
  status: z.enum(["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"])
})), EcommerceController.updateOrderStatus);

// Wishlist
router.get('/wishlist', requireAuth, EcommerceController.getWishlist);
router.post('/wishlist', requireAuth, validateBody(z.object({ productId: mongoIdSchema })), EcommerceController.addToWishlist);
router.delete('/wishlist/:productId', requireAuth, validateParams(z.object({ productId: mongoIdSchema })), EcommerceController.removeFromWishlist);

// Reviews
router.get('/reviews', validateQuery(paginationSchema.extend({
  productId: mongoIdSchema.optional(),
})), EcommerceController.getReviews);
router.post('/reviews', requireAuth, validateBody(createReviewSchema), EcommerceController.createReview);
router.patch('/reviews/:id', requireAuth, validateParams(z.object({ id: mongoIdSchema })), validateBody(updateReviewSchema), EcommerceController.updateReview);
router.delete('/reviews/:id', requireAuth, validateParams(z.object({ id: mongoIdSchema })), EcommerceController.deleteReview);

export default router;