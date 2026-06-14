import { Schema, model } from 'mongoose';

const orderItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  image: {
    type: String,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
});

const orderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    retailer: {
      type: Schema.Types.ObjectId,
      ref: 'Retailer',
      required: false, // Optional until customer selects an offer
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'offered', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryLocation: {
      tag: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    deliveryPreference: {
      type: String,
      enum: ['instant', 'scheduled'],
      default: 'instant',
    },
    selectedOffer: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      required: false,
    },
    totalAmount: {
      type: Number,
      required: false,
    },
    rejectedRetailers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Retailer',
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customer: 1 });
orderSchema.index({ retailer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = model('Order', orderSchema);
