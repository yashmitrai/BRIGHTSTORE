import { Schema, model } from 'mongoose';

const productSchema = new Schema(
  {
    retailer: {
      type: Schema.Types.ObjectId,
      ref: 'Retailer',
      required: false, // If null, this is a platform-wide product template
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    sku: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ retailer: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });

export const Product = model('Product', productSchema);
