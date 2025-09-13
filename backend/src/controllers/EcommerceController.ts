import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { School } from "../models/School";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { Cart } from "../models/Cart";
import { Order } from "../models/Order";
import { Wishlist } from "../models/Wishlist";
import { Review } from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError, ValidationError } from "../utils/errors";
import {
  getPaginationParams,
  createPaginationResult,
} from "../utils/pagination";
import { NotificationService } from "../services/NotificationService";
import mongoose from "mongoose";

export class EcommerceController {
  // Schools
  static getSchools = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { search, page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);

      const filter: any = { isDeleted: false };

      if (search) {
        filter.$text = { $search: search };
      }

      const [schools, total] = await Promise.all([
        School.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
        School.countDocuments(filter),
      ]);

      const result = createPaginationResult(schools, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static createSchool = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const school = new School(req.body);
      await school.save();

      res.status(201).json({
        success: true,
        data: school,
      });
    }
  );

  static updateSchool = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const school = await School.findOneAndUpdate(
        { _id: id, isDeleted: false },
        req.body,
        { new: true, runValidators: true }
      );

      if (!school) {
        throw new NotFoundError("School not found");
      }

      res.status(200).json({
        success: true,
        data: school,
      });
    }
  );

  static deleteSchool = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const school = await School.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.admin._id,
        },
        { new: true }
      );

      if (!school) {
        throw new NotFoundError("School not found");
      }

      res.status(200).json({
        success: true,
        message: "School deleted successfully",
      });
    }
  );

  // Categories
  static getCategories = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { search, page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);
console.log(req.query)
      const filter: any = { isDeleted: false };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const [categories, total] = await Promise.all([
        Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
        Category.countDocuments(filter),
      ]);

      const result = createPaginationResult(categories, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static createCategory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const category = new Category(req.body);
      await category.save();

      res.status(201).json({
        success: true,
        data: category,
      });
    }
  );

  static updateCategory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const category = await Category.findOneAndUpdate(
        { _id: id, isDeleted: false },
        req.body,
        { new: true, runValidators: true }
      );

      if (!category) {
        throw new NotFoundError("Category not found");
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    }
  );

  static deleteCategory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const category = await Category.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.admin._id,
        },
        { new: true }
      );

      if (!category) {
        throw new NotFoundError("Category not found");
      }

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    }
  );

  // Products
  static getProducts = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { category, school, search, isActive, page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);

      const filter: any = { isDeleted: false };

      if (category) filter.category = category;
      if (school) filter.school = school;
      if (isActive !== undefined) filter.isActive = isActive === "true";
      if (search) filter.$text = { $search: search };

      const [products, total] = await Promise.all([
        Product.find(filter)
          .populate("category", "name")
          .populate("school", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments(filter),
      ]);

      const result = createPaginationResult(products, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getProductById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const product = await Product.findOne({ _id: id, isDeleted: false })
        .populate("category", "name")
        .populate("school", "name")
        .populate("classLevel", "name");

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    }
  );

  static createProduct = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const product = new Product(req.body);
      await product.save();

      res.status(201).json({
        success: true,
        data: product,
      });
    }
  );

  static updateProduct = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    }
  );

  static deleteProduct = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.admin._id,
        },
        { new: true }
      );

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    }
  );

  // Cart
  static getCart = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user._id;

      let cart = await Cart.findOne({ userId }).populate({
        path: "items.productId",
        select: "name images category",
        populate: { path: "category", select: "name" },
      });

      if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
      }

      res.status(200).json({
        success: true,
        data: cart,
      });
    }
  );

  static addToCart = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { productId, variantId, quantity } = req.body;
      const userId = req.user._id;

      // Verify product and variant exist
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
      });

      if (!product) {
        throw new NotFoundError("Product not found or inactive");
      }

      const variant = product.variants.find(
        (v: any) => v._id.toString() === variantId
      );
      if (!variant) {
        throw new NotFoundError("Product variant not found");
      }

      if (variant.stock < quantity) {
        throw new ValidationError("Insufficient stock");
      }

      // Find or create cart
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      // Check if item already in cart
      const existingItemIndex = cart.items.findIndex(
        (item) =>
          item.productId.toString() === productId &&
          item.variantId.toString() === variantId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({
          productId,
          variantId,
          quantity,
          price: variant.price,
        });
      }

      await cart.save();

      res.status(200).json({
        success: true,
        data: cart,
      });
    }
  );

  static updateCartItem = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const userId = req.user._id;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new NotFoundError("Cart not found");
      }

      const item = cart.items.find(
        (item) => item.productId.toString() === itemId
      );
      if (!item) {
        throw new NotFoundError("Cart item not found");
      }

      item.quantity = quantity;
      await cart.save();

      res.status(200).json({
        success: true,
        data: cart,
      });
    }
  );

  static removeCartItem = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { itemId } = req.params;
      const userId = req.user._id;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        throw new NotFoundError("Cart not found");
      }

      cart.items = cart.items.filter(
        (item) => item.productId.toString() !== itemId
      );
      await cart.save();

      res.status(200).json({
        success: true,
        data: cart,
      });
    }
  );

  static clearCart = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user._id;

      const cart = await Cart.findOneAndUpdate(
        { userId },
        { items: [] },
        { new: true }
      );

      res.status(200).json({
        success: true,
        data: cart,
      });
    }
  );

  // Orders
  static checkout = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user._id;
      const { paymentType, shippingAddress, deliveryRate, freeShipping } =
        req.body;

      // Get cart
      const cart = await Cart.findOne({ userId }).populate("items.productId");
      if (!cart || cart.items.length === 0) {
        throw new ValidationError("Cart is empty");
      }

      // Calculate total
      let totalAmount = cart.items.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      if (!freeShipping) {
        totalAmount += deliveryRate;
      }

      // Create order
      const order = new Order({
        userId,
        items: cart.items,
        totalAmount,
        shippingAddress,
        paymentType,
        paymentStatus: paymentType === "COD" ? "pending" : "pending",
        deliveryRate,
        freeShipping,
      });

      await order.save();

      // Clear cart
      cart.items = [];
      await cart.save();

      res.status(201).json({
        success: true,
        data: order,
      });
    }
  );

  static getOrders = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);

      const [orders, total] = await Promise.all([
        Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        Order.countDocuments(),
      ]);

      const result = createPaginationResult(orders, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getMyOrders = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);
      const userId = req.user._id;

      const [orders, total] = await Promise.all([
        Order.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Order.countDocuments({ userId }),
      ]);

      const result = createPaginationResult(orders, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getOrderById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const filter: any = { _id: id };

      // Regular users can only see their own orders
      if (req.user && !req.admin) {
        filter.userId = req.user._id;
      }

      const order = await Order.findOne(filter).populate(
        "items.productId",
        "name images"
      );

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    }
  );

  static cancelOrder = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const userId = req.user._id;

      const order = await Order.findOne({ _id: id, userId, status: "pending" });

      if (!order) {
        throw new NotFoundError("Order not found or cannot be cancelled");
      }

      order.status = "cancelled";
      await order.save();

      res.status(200).json({
        success: true,
        data: order,
        message: "Order cancelled successfully",
      });
    }
  );

  static updateOrderStatus = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;

      const order = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // Notify user of status change
      await NotificationService.notifyOrderStatusUpdate(
        order.userId as mongoose.Types.ObjectId,
        order._id as mongoose.Types.ObjectId,
        status
      );

      res.status(200).json({
        success: true,
        data: order,
      });
    }
  );

  // Wishlist
  static getWishlist = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user._id;

      let wishlist = await Wishlist.findOne({ userId }).populate({
        path: "products",
        match: { isDeleted: false, isActive: true },
        select: "name images variants category",
        populate: { path: "category", select: "name" },
      });

      if (!wishlist) {
        wishlist = new Wishlist({ userId, products: [] });
        await wishlist.save();
      }

      res.status(200).json({
        success: true,
        data: wishlist,
      });
    }
  );

  static addToWishlist = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { productId } = req.body;
      const userId = req.user._id;

      // Verify product exists
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
      });

      if (!product) {
        throw new NotFoundError("Product not found or inactive");
      }

      let wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        wishlist = new Wishlist({ userId, products: [productId] });
      } else if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
      } else {
        throw new ValidationError("Product already in wishlist");
      }

      await wishlist.save();

      res.status(200).json({
        success: true,
        data: wishlist,
      });
    }
  );

  static removeFromWishlist = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { productId } = req.params;
      const userId = req.user._id;

      const wishlist = await Wishlist.findOne({ userId });
      if (!wishlist) {
        throw new NotFoundError("Wishlist not found");
      }

      wishlist.products = wishlist.products.filter(
        (id) => id.toString() !== productId
      );

      await wishlist.save();

      res.status(200).json({
        success: true,
        data: wishlist,
      });
    }
  );

  // Reviews
  static getReviews = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { productId, page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);

      const filter: any = { isDeleted: false };
      if (productId) filter.productId = productId;

      const [reviews, total] = await Promise.all([
        Review.find(filter)
          .populate("userId", "name")
          .populate("productId", "name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Review.countDocuments(filter),
      ]);

      const result = createPaginationResult(reviews, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static createReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { productId, rating, comment } = req.body;
      const userId = req.user._id;

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        productId,
        userId,
        isDeleted: false,
      });
      if (existingReview) {
        throw new ValidationError("You have already reviewed this product");
      }

      const review = new Review({
        productId,
        userId,
        rating,
        comment,
      });

      await review.save();

      res.status(201).json({
        success: true,
        data: review,
      });
    }
  );

  static updateReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const userId = req.user._id;

      const review = await Review.findOneAndUpdate(
        { _id: id, userId, isDeleted: false },
        req.body,
        { new: true, runValidators: true }
      );

      if (!review) {
        throw new NotFoundError("Review not found");
      }

      res.status(200).json({
        success: true,
        data: review,
      });
    }
  );

  static deleteReview = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const filter: any = { _id: id, isDeleted: false };

      // Regular users can only delete their own reviews
      if (req.user && !req.admin) {
        filter.userId = req.user._id;
      }

      const review = await Review.findOneAndUpdate(
        filter,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user?._id || req.admin?._id,
        },
        { new: true }
      );

      if (!review) {
        throw new NotFoundError("Review not found");
      }

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    }
  );
}
