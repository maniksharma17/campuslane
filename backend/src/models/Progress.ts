import mongoose, { Schema, Document } from 'mongoose';
import { ProgressStatus } from '../types';

export interface IProgress extends Document {
  studentId: mongoose.Types.ObjectId;
  contentId: mongoose.Types.ObjectId;
  status: ProgressStatus;
  timeSpent: number; // seconds
  quizScore?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const progressSchema = new Schema<IProgress>(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    status: { 
      type: String, 
      enum: ['not_started', 'in_progress', 'completed'], 
      default: 'not_started',
      required: true 
    },
    timeSpent: { type: Number, default: 0, min: 0 },
    quizScore: { type: Number, min: 0, max: 100 },
    completedAt: { type: Date },
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

progressSchema.index({ studentId: 1, contentId: 1 }, { unique: true });
progressSchema.index({ studentId: 1, status: 1 });
progressSchema.index({ contentId: 1 });

export const Progress = mongoose.model<IProgress>('Progress', progressSchema);