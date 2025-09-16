import mongoose, { Schema, Document } from 'mongoose';
import { Gender } from '../types';
import { v4 as uuidv4 } from "uuid";

export interface IProductVariant {
  name: string;
  price: number;
  cutoffPrice?: number;
  stock: number;
  images?: string[];
  id: string
}

export interface IProduct extends Document {
  name: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  images: string[];
  variants: IProductVariant[];
  school?: mongoose.Types.ObjectId;
  gender?: Gender;
  classLevel?: mongoose.Types.ObjectId;
  subject?: string;
  brand?: string;
  type?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const productVariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    cutoffPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    id: { type: String, required: true, default: uuidv4, immutable: true }
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: [{ type: String }],
    variants: [productVariantSchema],
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    gender: { type: String, enum: ['Boys', 'Girls', 'Unisex'] },
    classLevel: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    subject: { type: String },
    brand: { type: String },
    type: { type: String },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(_doc, ret) {
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.deletedAt;
        delete ret.deletedBy;
        return ret;
      },
    },
  }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ school: 1, isActive: 1 });
productSchema.index({ isActive: 1, isDeleted: 1 });
productSchema.index({ description: 'text' });

export const Product = mongoose.model<IProduct>('Product', productSchema);