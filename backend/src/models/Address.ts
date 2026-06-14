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
    houseNumber: {
      type: String,
      required: [true, 'House number/flat number is required'],
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    area: {
      type: String,
      required: [true, 'Area/locality is required'],
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
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
