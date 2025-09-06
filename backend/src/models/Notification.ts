import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  role: UserRole;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  meta?: Record<string, any>;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
      type: String, 
      enum: ['student', 'teacher', 'parent', 'admin'], 
      required: true 
    },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed },
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

notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ isDeleted: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);