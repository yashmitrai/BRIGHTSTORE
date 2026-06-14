import { Response } from 'express';
import { Order } from '../models/Order';
import { Offer } from '../models/Offer';
import { Retailer } from '../models/Retailer';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';
import { emitToUser, emitToRetailers } from '../services/socketService';

// --- CUSTOMER SIDE ---

export const createOrderRequest = async (req: AuthRequest, res: Response) => {
  const { items, deliveryLocation, deliveryPreference } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!deliveryLocation || !deliveryLocation.street || !deliveryLocation.city || !deliveryLocation.postalCode) {
      return res.status(400).json({ message: 'Delivery location details are required' });
    }

    const order = await Order.create({
      customer: req.user.id,
      items,
      deliveryLocation,
      deliveryPreference: deliveryPreference || 'instant',
      status: 'pending',
    });

    // Notify nearby retailers
    // For local simulation, we find all verified, active retailers
    const retailers = await Retailer.find({ status: 'active', isVerified: true });
    
    for (const retailer of retailers) {
      await Notification.create({
        recipient: retailer.owner,
        title: 'New Order Request Nearby',
        message: `A customer requested ${items.length} item(s) near your area. View marketplace to bid!`,
        type: 'new_request',
      });
    }

    // Emit real-time socket event to all retailers
    emitToRetailers('new_request', order);

    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getCustomerOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const orders = await Order.find({ customer: req.user.id })
      .populate('retailer', 'storeName rating reviewsCount')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id)
      .populate('customer', 'name email phone')
      .populate('retailer', 'storeName storeAddress rating owner');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Auth check: Customer, Retailer, or Admin
    if (req.user?.role !== 'admin' && order.customer._id.toString() !== req.user?.id) {
      // If retailer, check if they are the selected retailer
      if (req.user?.role === 'retailer') {
        const retailer = await Retailer.findOne({ owner: req.user.id });
        if (!retailer || (order.retailer && order.retailer._id.toString() !== retailer._id.toString())) {
          // Check if retailer has placed an offer on this order (so they can see the details)
          const offer = await Offer.findOne({ order: order._id, retailer: retailer?._id });
          if (!offer) {
            return res.status(403).json({ message: 'You do not have permission to view this order' });
          }
        }
      } else {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getOrderOffers = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view offers for this order' });
    }

    const offers = await Offer.find({ order: id })
      .populate({
        path: 'retailer',
        select: 'storeName storeAddress rating reviewsCount location description',
      })
      .sort({ totalCost: 1 });

    return res.json(offers);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const acceptOffer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // Order ID
  const { offerId } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customer.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Not authorized to accept offers for this order' });
    }

    const offer = await Offer.findById(offerId).populate('retailer');
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (offer.order.toString() !== id) {
      return res.status(400).json({ message: 'Offer does not belong to this order' });
    }

    // Accept selected offer
    offer.status = 'accepted';
    await offer.save();

    // Reject other offers
    await Offer.updateMany(
      { order: id, _id: { $ne: offerId } },
      { status: 'rejected' }
    );

    // Update order status
    order.retailer = offer.retailer._id;
    order.selectedOffer = offer._id;
    order.status = 'accepted';
    order.totalAmount = offer.totalCost;
    await order.save();

    // Notify the winning retailer
    const retailer = offer.retailer as any;
    await Notification.create({
      recipient: retailer.owner,
      title: 'Offer Accepted!',
      message: `Your offer of ₹${offer.totalCost} for Order #${order._id.toString().substring(18)} has been accepted. Please pack the items.`,
      type: 'order_status',
    });

    // Emit real-time socket event to the winning retailer
    emitToUser(retailer.owner.toString(), 'bid_accepted', order);

    return res.json({ message: 'Offer accepted successfully', order });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

// --- RETAILER SIDE ---

export const getMarketplaceOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(403).json({ message: 'Retailer profile required' });
    }

    // Only get orders that are pending or offered, and where this retailer has NOT offered yet
    const retailerOffers = await Offer.find({ retailer: retailer._id }).select('order');
    const offeredOrderIds = retailerOffers.map((o) => o.order.toString());

    const orders = await Order.find({
      status: { $in: ['pending', 'offered'] },
      _id: { $nin: offeredOrderIds },
      rejectedRetailers: { $ne: retailer._id },
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const submitOffer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // Order ID
  const { itemsPrice, deliveryFee, deliveryEstimate, distance, notes, itemsList } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(403).json({ message: 'Retailer profile required' });
    }

    if (!retailer.isVerified) {
      return res.status(403).json({ message: 'Only verified retailers can submit offers' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order request not found' });
    }

    if (order.status !== 'pending' && order.status !== 'offered') {
      return res.status(400).json({ message: 'Order is no longer accepting offers' });
    }

    // Check if retailer already submitted an offer
    const existingOffer = await Offer.findOne({ order: id, retailer: retailer._id });
    if (existingOffer) {
      return res.status(400).json({ message: 'You have already submitted an offer for this order' });
    }

    const totalCost = Number(itemsPrice) + Number(deliveryFee);

    const offer = await Offer.create({
      order: id,
      retailer: retailer._id,
      itemsPrice,
      deliveryFee,
      totalCost,
      deliveryEstimate,
      distance,
      notes: notes || '',
      itemsList: itemsList || [],
      status: 'pending',
    });

    // Mark order status as offered
    order.status = 'offered';
    await order.save();

    // Notify customer
    await Notification.create({
      recipient: order.customer,
      title: 'New Offer Received!',
      message: `${retailer.storeName} offered to deliver your request for ₹${totalCost} in ${deliveryEstimate}.`,
      type: 'new_offer',
    });

    // Emit real-time socket event to the customer
    emitToUser(order.customer.toString(), 'new_bid', { orderId: id, offer });

    return res.status(201).json(offer);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // Order ID
  const { status } = req.body;

  const validStatuses = ['packed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status update' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(403).json({ message: 'Retailer profile required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.retailer?.toString() !== retailer._id.toString()) {
      return res.status(403).json({ message: 'You are not the assigned retailer for this order' });
    }

    order.status = status;
    await order.save();

    // Map database enum status to user friendly string
    const statusMap: any = {
      packed: 'packed and is ready for dispatch',
      out_for_delivery: 'out for delivery',
      delivered: 'delivered successfully',
      cancelled: 'cancelled',
    };

    // Notify customer
    await Notification.create({
      recipient: order.customer,
      title: `Order Status Update: ${status.replace(/_/g, ' ').toUpperCase()}`,
      message: `Your order from ${retailer.storeName} has been ${statusMap[status]}.`,
      type: 'order_status',
    });

    // Emit real-time socket event to the customer
    emitToUser(order.customer.toString(), 'status_updated', order);

    return res.json(order);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getRetailerOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(403).json({ message: 'Retailer profile required' });
    }

    // Get orders where this retailer is assigned
    const orders = await Order.find({ retailer: retailer._id })
      .populate('customer', 'name email phone')
      .sort({ updatedAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const rejectOrder = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // Order ID

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(403).json({ message: 'Retailer profile required' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order request not found' });
    }

    // Add retailer._id to rejectedRetailers if not already present
    if (!order.rejectedRetailers.includes(retailer._id as any)) {
      order.rejectedRetailers.push(retailer._id as any);
      await order.save();
    }

    return res.json({ message: 'Order request hidden/rejected successfully' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
