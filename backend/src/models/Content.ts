import mongoose, { Schema, Document } from 'mongoose';
import { ContentType, ApprovalStatus, QuizType, UserRole } from '../types';

export interface IContent extends Document {
  title: string;
  description?: string;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  chapterId: mongoose.Types.ObjectId;
  type: ContentType;
  s3Key?: string;
  thumbnailKey?: string;
  fileUrl?: string;
  videoUrl?: string;
  quizType?: QuizType;
  googleFormUrl?: string;
  uploaderId: mongoose.Types.ObjectId;
  uploaderRole: UserRole;
  isAdminContent: boolean;
  approvalStatus: ApprovalStatus;
  tags: string[];
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const contentSchema = new Schema<IContent>(
  {
    title: { type: String, required: true },
    description: { type: String },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', required: true },
    type: { 
      type: String, 
      enum: ['file', 'video', 'quiz', 'game'], 
      required: true 
    },
    s3Key: { type: String },
    thumbnailKey: { type: String },
    fileUrl: { type: String },
    videoUrl: { type: String },
    quizType: { 
      type: String, 
      enum: ['googleForm', 'native'],
      required: function(this: IContent) { return this.type === 'quiz'; }
    },
    googleFormUrl: { type: String },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaderRole: { 
      type: String, 
      enum: ['teacher', 'admin'], 
      required: true 
    },
    isAdminContent: { type: Boolean, default: false },
    approvalStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      required: true,
      default: 'pending'
    },
    tags: [{ type: String }],
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

// Auto-approve admin content
contentSchema.pre('save', function(next) {
  if (this.isNew && this.uploaderRole === 'admin') {
    this.approvalStatus = 'approved';
    this.isAdminContent = true;
  }
  next();
});

contentSchema.index({ classId: 1, subjectId: 1, chapterId: 1 });
contentSchema.index({ approvalStatus: 1, uploaderRole: 1 });
contentSchema.index({ uploaderId: 1 });
contentSchema.index({ type: 1 });
contentSchema.index({ isDeleted: 1 });
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Content = mongoose.model<IContent>('Content', contentSchema);