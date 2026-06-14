import { Schema, model } from 'mongoose';

const offerSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    retailer: {
      type: Schema.Types.ObjectId,
      ref: 'Retailer',
      required: true,
    },
    itemsPrice: {
      type: Number,
      required: [true, 'Items price is required'],
      min: [0, 'Price cannot be negative'],
    },
    deliveryFee: {
      type: Number,
      required: [true, 'Delivery fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative'],
    },
    deliveryEstimate: {
      type: String,
      required: [true, 'Delivery estimate is required'],
    },
    distance: {
      type: Number,
      required: [true, 'Distance estimate is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    itemsList: [
      {
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Item price cannot be negative'],
        },
        inStock: {
          type: Boolean,
          default: true,
        },
        alternativeName: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Offer = model('Offer', offerSchema);
