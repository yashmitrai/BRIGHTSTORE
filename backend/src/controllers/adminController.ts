import { Response } from 'express';
import { User } from '../models/User';
import { Retailer } from '../models/Retailer';
import { Order } from '../models/Order';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAdminOverview = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRetailers = await Retailer.countDocuments();
    const verifiedRetailers = await Retailer.countDocuments({ isVerified: true });
    const unverifiedRetailers = await Retailer.countDocuments({ isVerified: false });
    const totalOrders = await Order.countDocuments();
    
    // Calculate GMV (Gross Merchandise Value)
    const completedOrders = await Order.find({ status: 'delivered' });
    const gmv = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return res.json({
      totalUsers,
      totalRetailers,
      verifiedRetailers,
      unverifiedRetailers,
      totalOrders,
      gmv: gmv || 24900, // Fallback demo data if database is fresh
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getRetailers = async (req: AuthRequest, res: Response) => {
  try {
    const retailers = await Retailer.find().populate('owner', 'name email phone');
    return res.json(retailers);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const verifyRetailer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isVerified } = req.body; // boolean

  try {
    const retailer = await Retailer.findById(id);
    if (!retailer) {
      return res.status(404).json({ message: 'Retailer not found' });
    }

    retailer.isVerified = isVerified;
    await retailer.save();

    // Notify retailer owner
    await Notification.create({
      recipient: retailer.owner,
      title: isVerified ? 'Store Profile Verified!' : 'Store Profile Verification Revoked',
      message: isVerified
        ? `Congratulations! your store "${retailer.storeName}" has been verified. You can now bid on customer orders.`
        : `Your store verification for "${retailer.storeName}" has been revoked by the administrator.`,
      type: 'verification_status',
    });

    return res.json({ message: `Retailer verification status updated to ${isVerified}`, retailer });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email')
      .populate('retailer', 'storeName')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
