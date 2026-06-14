import { Request, Response } from 'express';
import { Retailer } from '../models/Retailer';
import { AuthRequest } from '../middleware/authMiddleware';

export const getRetailers = async (req: Request, res: Response) => {
  const { category } = req.query;
  const filter: any = { isVerified: true, status: 'active' };

  if (category) {
    filter.category = String(category);
  }

  try {
    const retailers = await Retailer.find(filter).populate('owner', 'name email phone');
    return res.json(retailers);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getRetailerById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const retailer = await Retailer.findById(id).populate('owner', 'name email phone');
    if (!retailer) {
      return res.status(404).json({ message: 'Retailer not found' });
    }
    return res.json(retailer);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getNearbyRetailers = async (req: Request, res: Response) => {
  const { latitude, longitude, maxDistance, category } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'latitude and longitude are required' });
  }

  // maxDistance is optional, default to 5000 meters (5km)
  const distLimit = Number(maxDistance) || 5000;

  try {
    const filter: any = {
      isVerified: true,
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: distLimit,
        },
      },
    };

    if (category) {
      filter.category = String(category);
    }

    const retailers = await Retailer.find(filter).populate('owner', 'name email phone');
    return res.json(retailers);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const updateStoreSettings = async (req: AuthRequest, res: Response) => {
  const {
    storeName,
    storeAddress,
    category,
    description,
    openingHours,
    closingHours,
    storeLogo,
    storeBanner,
    contactPhone,
    contactEmail,
    latitude,
    longitude,
  } = req.body;

  try {
    if (!req.user || req.user.role !== 'retailer') {
      return res.status(403).json({ message: 'Authorized retailers only' });
    }

    const retailer = await Retailer.findOne({ owner: req.user.id });
    if (!retailer) {
      return res.status(404).json({ message: 'Retailer profile not found' });
    }

    if (storeName) retailer.storeName = storeName;
    if (storeAddress) retailer.storeAddress = storeAddress;
    if (description !== undefined) retailer.description = description;
    if (openingHours) retailer.openingHours = openingHours;
    if (closingHours) retailer.closingHours = closingHours;
    if (storeLogo !== undefined) retailer.storeLogo = storeLogo;
    if (storeBanner !== undefined) retailer.storeBanner = storeBanner;
    if (contactPhone !== undefined) retailer.contactPhone = contactPhone;
    if (contactEmail !== undefined) retailer.contactEmail = contactEmail;

    if (category) {
      retailer.category = Array.isArray(category)
        ? category
        : category.split(',').map((c: string) => c.trim());
    }

    if (latitude !== undefined && longitude !== undefined) {
      retailer.location = {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)],
      };
    }

    await retailer.save();
    return res.json({ message: 'Store profile updated successfully', retailer });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
