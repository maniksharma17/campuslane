export interface Admin {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  role: 'student' | 'teacher' | 'parent';
  avatar?: string;
  googleId?: string;
  age?: number;
  studentCode?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  subjectsCount?: number;
  contentCount?: number;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  classId: string;
  className?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  chaptersCount?: number;
  contentCount?: number;
}

export interface Chapter {
  id: string;
  name: string;
  description?: string;
  subjectId: string;
  subjectName?: string;
  order: number;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  contentCount?: number;
}

export interface Content {
  id: string;
  title: string;
  description?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  chapterId: string;
  chapterName?: string;
  type: 'file' | 'video' | 'quiz' | 'game';
  s3Key?: string;
  fileUrl?: string;
  videoUrl?: string;
  quizType?: 'googleForm' | 'native';
  googleFormUrl?: string;
  uploaderId: string;
  uploaderName?: string;
  uploaderRole: 'teacher' | 'admin';
  isAdminContent: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  tags: string[];
  thumbnail?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  productsCount?: number;
}

import mongoose from "mongoose";

export interface IProductVariant {
  _id?: string;
  name: string;
  price: number;
  cutoffPrice?: number;
  stock: number;
  images?: string[];
}

export interface IProduct {
  _id: string;
  name: string;
  description?: string;
  category: { _id: mongoose.Types.ObjectId, name: string} | string;
  images: string[];
  variants: IProductVariant[];
  school?: mongoose.Types.ObjectId | string;
  gender?: "Boys" | "Girls" | "Unisex";
  classLevel?: string;
  subject?: string;
  brand?: string;
  type?: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId | string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;
  items: {
    productId: string;
    productName?: string;
    variantId: string;
    variantName?: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipcode: string;
    country: string;
  };
  paymentType: 'COD' | 'Razorpay';
  paymentStatus: 'pending' | 'success' | 'failed';
  paymentId?: string;
  deliveryRate: number;
  freeShipping: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  meta?: any;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}