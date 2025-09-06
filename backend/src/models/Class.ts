import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  name: string;
  description?: string;
  thumbnailKey: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const classSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    thumbnailKey: { type: String },
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

classSchema.index({ isDeleted: 1 });

export const Class = mongoose.model<IClass>('Class', classSchema);