import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus, PaymentType, PaymentStatus } from '../types';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  street: string;
  streetOptional?: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: IShippingAddress;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  deliveryRate: number;
  freeShipping: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    streetOptional: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], 
      default: 'pending',
      required: true 
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentType: { 
      type: String, 
      enum: ['COD', 'Razorpay'], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'success', 'failed'], 
      default: 'pending',
      required: true 
    },
    paymentId: { type: String },
    deliveryRate: { type: Number, default: 0, min: 0 },
    freeShipping: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);