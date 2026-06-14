import { Schema, model } from 'mongoose';

const reviewSchema = new Schema(
  {
    retailer: {
      type: Schema.Types.ObjectId,
      ref: 'Retailer',
      required: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = model('Review', reviewSchema);
