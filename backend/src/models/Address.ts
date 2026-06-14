import { Schema, model } from 'mongoose';

const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tag: {
      type: String,
      default: 'Home',
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      default: 12.9716, // Default Bangalore latitude
    },
    longitude: {
      type: Number,
      default: 77.5946, // Default Bangalore longitude
    },
  },
  {
    timestamps: true,
  }
);

export const Address = model('Address', addressSchema);
