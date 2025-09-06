import mongoose, { Schema, Document } from 'mongoose';
import { ApprovalStatus } from '../types';

export interface IParentChildLink extends Document {
  parentId: mongoose.Types.ObjectId;
  childId: mongoose.Types.ObjectId;
  status: ApprovalStatus;
  requestedAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const parentChildLinkSchema = new Schema<IParentChildLink>(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending',
      required: true 
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
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

parentChildLinkSchema.index({ parentId: 1, childId: 1 }, { unique: true });
parentChildLinkSchema.index({ childId: 1, status: 1 });
parentChildLinkSchema.index({ parentId: 1, status: 1 });

export const ParentChildLink = mongoose.model<IParentChildLink>('ParentChildLink', parentChildLinkSchema);