import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  contents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const bookmarkSchema = new Schema<IWishlist>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    contents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
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

export const Bookmark = mongoose.model<IWishlist>('Bookmark', bookmarkSchema);