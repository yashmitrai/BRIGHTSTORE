import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Retailer } from '../models/Retailer';
import { AuthRequest } from '../middleware/authMiddleware';

export const createReview = async (req: AuthRequest, res: Response) => {
  const { retailerId, rating, comment } = req.body;

  if (!retailerId || !rating) {
    return res.status(400).json({ message: 'Retailer ID and rating are required' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if retailer exists
    const retailer = await Retailer.findById(retailerId);
    if (!retailer) {
      return res.status(404).json({ message: 'Retailer not found' });
    }

    // Create review
    const review = await Review.create({
      retailer: retailerId,
      customer: req.user.id,
      rating,
      comment: comment || '',
    });

    // Populate customer info
    await review.populate('customer', 'name profilePhoto');

    // Recalculate retailer rating
    const reviews = await Review.find({ retailer: retailerId });
    const count = reviews.length;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

    retailer.rating = Number(avg.toFixed(1));
    retailer.reviewsCount = count;
    await retailer.save();

    return res.status(201).json(review);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getRetailerReviews = async (req: Request, res: Response) => {
  const { retailerId } = req.params;

  try {
    const reviews = await Review.find({ retailer: retailerId })
      .populate('customer', 'name profilePhoto')
      .sort({ createdAt: -1 });

    // Aggregate rating breakdown counts
    const counts = [0, 0, 0, 0, 0]; // Index 0 for 1 star, 4 for 5 star
    let totalScore = 0;

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star - 1]++;
      totalScore += r.rating;
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 5.0;

    const breakdown = {
      5: counts[4],
      4: counts[3],
      3: counts[2],
      2: counts[1],
      1: counts[0],
    };

    return res.json({
      reviews,
      stats: {
        averageRating,
        totalReviews,
        breakdown,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this review' });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Recalculate retailer rating
    const retailerId = review.retailer;
    const retailer = await Retailer.findById(retailerId);
    if (retailer) {
      const reviews = await Review.find({ retailer: retailerId });
      const count = reviews.length;
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

      retailer.rating = Number(avg.toFixed(1));
      retailer.reviewsCount = count;
      await retailer.save();
    }

    return res.json(review);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const retailerId = review.retailer;
    await Review.findByIdAndDelete(id);

    // Recalculate retailer rating
    const retailer = await Retailer.findById(retailerId);
    if (retailer) {
      const reviews = await Review.find({ retailer: retailerId });
      const count = reviews.length;
      const avg = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 5.0;

      retailer.rating = Number(avg.toFixed(1));
      retailer.reviewsCount = count;
      await retailer.save();
    }

    return res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
