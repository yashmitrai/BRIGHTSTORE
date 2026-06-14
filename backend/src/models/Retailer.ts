import { Schema, model, Document } from 'mongoose';

const retailerSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    storeAddress: {
      type: String,
      required: [true, 'Store address is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Store coordinates are required'],
      },
    },
    category: {
      type: [String],
      required: [true, 'Store categories are required'],
    },
    description: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    openingHours: {
      type: String,
      default: '09:00',
    },
    closingHours: {
      type: String,
      default: '21:00',
    },
    storeLogo: {
      type: String,
      default: '',
    },
    storeBanner: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// GeoJSON index for location lookup
retailerSchema.index({ location: '2dsphere' });
retailerSchema.index({ owner: 1 });
retailerSchema.index({ isVerified: 1 });

export const Retailer = model('Retailer', retailerSchema);
