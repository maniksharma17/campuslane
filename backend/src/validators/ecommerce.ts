import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  logo: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
});

export const updateSchoolSchema = createSchoolSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  image: z.string()
});

export const updateCategorySchema = createCategorySchema.partial();

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  cutoffPrice: z.number().min(0, 'Cutoff price must be non-negative').optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative').default(0),
  images: z.array(z.string()).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category ID is required'),
  images: z.array(z.string()).default([]),
  variants: z.array(productVariantSchema).min(1, 'At least one variant is required'),
  school: z.string().optional(),
  gender: z.enum(['Boys', 'Girls', 'Unisex']).optional(),
  classLevel: z.string().optional(),
  subject: z.string().optional(),
  brand: z.string().optional(),
  type: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const checkoutSchema = z.object({
  paymentType: z.enum(['COD', 'Razorpay']),
  shippingAddress: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone is required'),
    street: z.string().min(1, 'Street is required'),
    streetOptional: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipcode: z.string().min(1, 'Zipcode is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  deliveryRate: z.number().min(0).default(0),
  freeShipping: z.boolean().default(false),
});

export const createReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  comment: z.string().optional(),
});