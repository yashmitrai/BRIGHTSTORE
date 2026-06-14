import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['order_status', 'new_offer', 'new_request', 'verification_status', 'general'],
      default: 'general',
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

import { emitToUser } from '../services/socketService';

notificationSchema.post('save', function (doc) {
  try {
    emitToUser(doc.recipient.toString(), 'notification', doc);
  } catch (err) {
    // Gracefully handle if socket is not initialized
  }
});

export const Notification = model('Notification', notificationSchema);
