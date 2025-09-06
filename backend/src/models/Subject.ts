import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  description?: string;
  classId: mongoose.Types.ObjectId;
  thumbnailKey: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    thumbnailKey: { type: String },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, unique: false },
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

subjectSchema.removeIndex("classId_1")

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);