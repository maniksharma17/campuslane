import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter extends Document {
  name: string;
  description?: string;
  subjectId: mongoose.Types.ObjectId;
  thumbnailKey: string;
  order: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const chapterSchema = new Schema<IChapter>(
  {
    name: { type: String, required: true },
    description: { type: String },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    thumbnailKey: { type: String },
    order: { type: Number, required: true, default: 0 },
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

chapterSchema.index({ isDeleted: 1 });

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema);