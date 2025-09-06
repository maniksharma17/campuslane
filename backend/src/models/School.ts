import mongoose, { Schema, Document } from 'mongoose';

export interface ISchool extends Document {
  name: string;
  logo?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const schoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, unique: true },
    logo: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
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

schoolSchema.index({ isDeleted: 1 });
schoolSchema.index({ name: 'text' });

export const School = mongoose.model<ISchool>('School', schoolSchema);