import { Response } from 'express';
import { Address } from '../models/Address';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const addresses = await Address.find({ user: req.user.id });
    return res.json(addresses);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const createAddress = async (req: AuthRequest, res: Response) => {
  const { tag, street, city, postalCode, latitude, longitude } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const address = await Address.create({
      user: req.user.id,
      tag: tag || 'Home',
      street,
      city,
      postalCode,
      latitude: latitude || 12.9716,
      longitude: longitude || 77.5946,
    });

    return res.status(201).json(address);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const address = await Address.findById(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (address.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this address' });
    }

    await Address.findByIdAndDelete(id);

    return res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
