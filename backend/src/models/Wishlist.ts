import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
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

export const Wishlist = mongoose.model<IWishlist>('Wishlist', wishlistSchema);