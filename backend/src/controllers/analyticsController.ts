import { Response } from 'express';
import { Order } from '../models/Order';
import { Offer } from '../models/Offer';
import { Product } from '../models/Product';
import { Retailer } from '../models/Retailer';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

export const getRetailerAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(403).json({ message: 'Retailer profile required' });
    }

    const retailerId = retailer._id;

    // 1. Core KPIs Aggregation
    const kpis = await Order.aggregate([
      { $match: { retailer: retailerId, status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const activeOrdersCount = await Order.countDocuments({
      retailer: retailerId,
      status: { $in: ['accepted', 'packed', 'out_for_delivery'] },
    });

    const inventoryCount = await Product.countDocuments({ retailer: retailerId });

    // Conversion Rate: Accepted Offers / Total Offers
    const offerStats = await Offer.aggregate([
      { $match: { retailer: retailerId } },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          acceptedBids: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
          },
        },
      },
    ]);

    const totalBids = offerStats[0]?.totalBids || 0;
    const acceptedBids = offerStats[0]?.acceptedBids || 0;
    const conversionRate = totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0;

    // 2. Top Selling Products Aggregation
    const topProducts = await Order.aggregate([
      { $match: { retailer: retailerId, status: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          sales: { $sum: '$items.quantity' },
        },
      },
      { $project: { name: '$_id', sales: 1, _id: 0 } },
      { $sort: { sales: -1 } },
      { $limit: 5 },
    ]);

    // 3. Weekly Revenue Trend (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueTrendRaw = await Order.aggregate([
      {
        $match: {
          retailer: retailerId,
          status: 'delivered',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill dates with 0 if missing
    const dateList: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dateList.push(d.toISOString().split('T')[0]);
    }

    const revenueTrend = dateList.map((dateStr) => {
      const dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      const matched = revenueTrendRaw.find((item) => item._id === dateStr);
      return {
        date: dayName,
        revenue: matched ? matched.revenue : 0,
      };
    });

    const totalRevenue = kpis[0]?.totalRevenue || 0;
    const totalOrders = kpis[0]?.totalOrders || 0;
    const avgOrderValue = Math.round(kpis[0]?.avgOrderValue || 0);

    return res.json({
      kpis: {
        totalRevenue,
        avgOrderValue,
        totalOrders,
        activeOrders: activeOrdersCount,
        inventoryCount,
        rating: retailer.rating,
        reviewsCount: retailer.reviewsCount,
        conversionRate,
      },
      topProducts: topProducts.length > 0 ? topProducts : [
        { name: 'Fresh Organic Tomatoes', sales: 0 },
        { name: 'Full Cream Milk 1L', sales: 0 },
      ],
      revenueTrend,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // 1. GMV and total orders
    const orderStats = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalGMV: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalGMV = orderStats[0]?.totalGMV || 0;
    const totalOrders = orderStats[0]?.totalOrders || 0;

    // 2. Registries counts
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalRetailers = await Retailer.countDocuments();
    const unverifiedRetailers = await Retailer.countDocuments({ isVerified: false });

    // 3. Platform Growth Trend (by month)
    const orderTrend = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          gmv: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', gmv: 1, orders: 1, _id: 0 } },
    ]);

    return res.json({
      kpis: {
        totalGMV,
        totalOrders,
        totalUsers,
        totalRetailers,
        unverifiedRetailers,
      },
      orderTrend,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getCustomerAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const customerId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Core Customer KPIs
    const customerStats = await Order.aggregate([
      { $match: { customer: customerId, status: 'delivered' } },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalSpent = customerStats[0]?.totalSpent || 0;
    const totalOrders = customerStats[0]?.totalOrders || 0;

    // 2. Spending by Category Aggregation
    const categoryStats = await Order.aggregate([
      { $match: { customer: customerId, status: 'delivered' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$productDetails.category', 'Uncategorized'] },
          value: { $sum: 1 },
        },
      },
      { $project: { name: '$_id', value: 1, _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    // 3. Savings Comparison: average cost of other offers vs. accepted cost on customer orders
    const savingsStats = await Order.aggregate([
      { $match: { customer: customerId, status: 'delivered', selectedOffer: { $exists: true } } },
      {
        $lookup: {
          from: 'offers',
          localField: '_id',
          foreignField: 'order',
          as: 'allOffers',
        },
      },
      {
        $project: {
          totalAmount: 1,
          avgOfferCost: { $avg: '$allOffers.totalCost' },
        },
      },
      {
        $group: {
          _id: null,
          totalSaved: { $sum: { $subtract: ['$avgOfferCost', '$totalAmount'] } },
        },
      },
    ]);

    const totalSaved = Math.max(0, Math.round(savingsStats[0]?.totalSaved || 0));

    return res.json({
      kpis: {
        totalSpent,
        totalOrders,
        totalSaved,
      },
      categoryStats: categoryStats.length > 0 ? categoryStats : [{ name: 'Grocery', value: 1 }],
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
