import { Schema, model } from 'mongoose';

const ticketSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['Order Issue', 'Delivery Issue', 'Payment Issue', 'Product Issue', 'Other'],
      required: [true, 'Ticket category is required'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    replies: [
      {
        sender: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Ticket = model('Ticket', ticketSchema);
