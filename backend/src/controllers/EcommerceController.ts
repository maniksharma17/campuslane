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
      console.log(req.query);
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
  // Updated static getProducts method with extended filtering (brand, gender, subject, type, price, inStock), aggregation for minPrice & totalStock, and sorting.

  static getProducts = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const {
          category,
          school,
          brand,
          gender,
          subject,
          type,
          search,
          isActive,
          minPrice,
          maxPrice,
          inStock,
          sort = "relevance",
          page = 1,
          limit = 12,
        } = req.query as any;

        const { skip } = getPaginationParams(req.query);

        // helper: escape regex special chars
        const escapeRegex = (s: string) =>
          s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Build the base "static" filters (not including search)
        const baseMatch: any = { isDeleted: false };
        if (category)
          baseMatch.category = mongoose.Types.ObjectId.isValid(category)
            ? new mongoose.Types.ObjectId(category)
            : category;
        if (school)
          baseMatch.school = mongoose.Types.ObjectId.isValid(school)
            ? new mongoose.Types.ObjectId(school)
            : school;
        if (brand) baseMatch.brand = brand;
        if (gender) baseMatch.gender = gender;
        if (subject) baseMatch.subject = subject;
        if (type) baseMatch.type = type;
        if (isActive !== undefined) baseMatch.isActive = isActive === "true";

        // Price query helpers (allow 0)
        const hasMin =
          minPrice !== undefined && minPrice !== null && minPrice !== "";
        const hasMax =
          maxPrice !== undefined && maxPrice !== null && maxPrice !== "";

        // Build the common remainder of the pipeline (after the initial $match)
        const buildRestPipeline = (opts: { includeTextScore?: boolean }) => {
          const pipeline: any[] = [];

          // If $text was used in the opening match, we can add textScore
          if (opts.includeTextScore) {
            pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
          }

          // unwind variants for price/stock filtering
          pipeline.push({
            $unwind: { path: "$variants", preserveNullAndEmptyArrays: true },
          });

          // price filters based on variants
          if (hasMin || hasMax) {
            const priceFilter: any = {};
            if (hasMin) priceFilter.$gte = Number(minPrice);
            if (hasMax) priceFilter.$lte = Number(maxPrice);
            pipeline.push({ $match: { "variants.price": priceFilter } });
          }

          // in-stock filter
          if (inStock === "true") {
            pipeline.push({ $match: { "variants.stock": { $gt: 0 } } });
          }

          // group back to product level + aggregate minPrice & totalStock
          pipeline.push({
            $group: {
              _id: "$_id",
              doc: { $first: "$$ROOT" },
              variants: { $push: "$variants" },
              minPrice: { $min: "$variants.price" },
              totalStock: { $sum: { $ifNull: ["$variants.stock", 0] } },
            },
          });

          // restore root and attach aggregates
          pipeline.push({
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  "$doc",
                  {
                    minPrice: "$minPrice",
                    totalStock: "$totalStock",
                    variants: "$variants",
                  },
                ],
              },
            },
          });

          // lookups
          pipeline.push(
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category",
              },
            },
            {
              $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
            },
            {
              $lookup: {
                from: "schools",
                localField: "school",
                foreignField: "_id",
                as: "school",
              },
            },
            { $unwind: { path: "$school", preserveNullAndEmptyArrays: true } }
          );

          // sort stage to be injected inside facet later (we return it and let caller put the facet)
          return pipeline;
        };

        // helper: build a full pipeline given a firstMatch and whether it used $text
        const buildFullPipeline = (firstMatch: any, usedText: boolean) => {
          const pipeline = [
            { $match: firstMatch },
            ...buildRestPipeline({ includeTextScore: usedText }),
          ];

          // build sortStage
          const sortStage: any = {};
          if (sort === "price_asc") sortStage.minPrice = 1;
          else if (sort === "price_desc") sortStage.minPrice = -1;
          else if (sort === "newest") sortStage.createdAt = -1;
          else if (sort === "relevance" && usedText)
            sortStage.score = { $meta: "textScore" };
          else sortStage.createdAt = -1;

          // append facet (pagination + total)
          pipeline.push({
            $facet: {
              docs: [
                { $sort: sortStage },
                { $skip: skip },
                { $limit: Number(limit) },
              ],
              totalCount: [{ $count: "count" }],
            },
          });

          return pipeline;
        };

        // detect planner-level errors we want to fallback on
        const isPlannerError = (err: any) => {
          const code = err?.code || err?.errorResponse?.code;
          const msg = String(err?.message || err?.errmsg || "");
          return (
            code === 291 ||
            msg.includes("No query solutions") ||
            msg.includes("NoQueryExecutionPlans")
          );
        };

        let aggResult: any[] = [];
        // If search exists, try $text-first pipeline (text gives stemming/relevance).
        if (search) {
          const textFirstMatch = {
            ...baseMatch,
            $text: { $search: String(search) },
          };

          try {
            const pipeline = buildFullPipeline(textFirstMatch, true);
            aggResult = await Product.aggregate(pipeline).exec();
          } catch (err) {
            // If planner failed for mixing $text + regex (NoQueryExecutionPlans), fallback to regex-only
            if (isPlannerError(err)) {
              // Build regex-only match (substring, case-insensitive)
              const escaped = escapeRegex(String(search));
              const regexMatch = {
                ...baseMatch,
                $or: [
                  { name: { $regex: escaped, $options: "i" } },
                  { description: { $regex: escaped, $options: "i" } },
                  { brand: { $regex: escaped, $options: "i" } },
                ],
              };
              const pipeline = buildFullPipeline(regexMatch, false);
              aggResult = await Product.aggregate(pipeline).exec();
            } else {
              throw err; // rethrow for other unexpected errors
            }
          }
        } else {
          // No search: just run base match pipeline
          const pipeline = buildFullPipeline(baseMatch, false);
          aggResult = await Product.aggregate(pipeline).exec();
        }

        const products = aggResult[0]?.docs || [];
        const total = aggResult[0]?.totalCount?.[0]?.count || 0;

        return res.status(200).json({
          success: true,
          docs: products,
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.max(1, Math.ceil(total / Number(limit))),
        });
      } catch (err) {
        console.error("getProducts error", err);
        return res.status(500).json({ success: false, error: "Server error" });
      }
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

      let cart = await Cart.findOne({ userId })
        .populate({
          path: "items.productId",
          select: "name images category variants",
          populate: { path: "category", select: "name" },
        })
        .lean();

      if (!cart) {
        await Cart.create({ userId, items: [] });
        return res.status(200).json({ success: true, data: cart });
      }

      // attach the chosen variant to each item
      cart.items = cart.items.map((item: any) => {
        const product = item.productId;
        if (product?.variants && item.variantId) {
          const variant = product.variants.find(
            (v: any) => v._id.toString() === item.variantId.toString()
          );
          return {
            ...item,
            productId: {
              ...product,
              selectedVariant: variant || null,
            },
          };
        }
        return item;
      });

      return res.status(200).json({
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
      console.log(cart);
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

  static reorder = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user._id;
      const { orderId } = req.params;

      // Find order
      const order = await Order.findOne({ _id: orderId, userId }).lean();
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Ensure items exist
      if (!order.items || order.items.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Order has no items to reorder" });
      }

      // Find or create user's cart
      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      // Merge items from order into cart
      order.items.forEach((it: any) => {
        const existing = cart.items.find(
          (c: any) =>
            String(c.productId) === String(it.productId) &&
            String(c.variantId) === String(it.variantId)
        );

        if (existing) {
          existing.quantity += it.quantity;
        } else {
          cart.items.push({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
            price: it.price,
          });
        }
      });

      await cart.save();

      return res.status(200).json({
        success: true,
        message: "Items from order added to your cart",
        data: cart,
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
        "name images variants"
      );

      if (!order) {
        throw new NotFoundError("Order not found");
      }

      // attach variant details manually
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.map((item: any) => {
        const variant =
          item.productId?.variants?.find(
            (v: any) => v._id.toString() === item.variantId.toString()
          ) || null;
        return {
          ...item,
          variant,
        };
      });

      res.status(200).json({
        success: true,
        data: orderObj,
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

      // Ensure product exists & is active
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
      });

      if (!product) {
        throw new NotFoundError("Product not found or inactive");
      }

      // Atomically create or update wishlist
      const wishlist = await Wishlist.findOneAndUpdate(
        { userId },
        { $addToSet: { products: productId } }, // $addToSet = no duplicates
        { upsert: true, new: true }
      ).populate("products", "name images variants minPrice brand");

      return res.status(200).json({
        success: true,
        message: "Product added to wishlist",
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
