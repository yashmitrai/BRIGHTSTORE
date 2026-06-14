import { Response } from 'express';
import { Address } from '../models/Address';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    return res.json(addresses);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const createAddress = async (req: AuthRequest, res: Response) => {
  const { tag, houseNumber, street, area, landmark, city, state, pincode, isDefault, latitude, longitude } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!houseNumber || !street || !area || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Required fields: houseNumber, street, area, city, state, pincode' });
    }

    const addressCount = await Address.countDocuments({ user: req.user.id });
    const shouldBeDefault = isDefault === true || addressCount === 0;

    if (shouldBeDefault) {
      // Unset all other default addresses for this user
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      tag: tag || 'Home',
      houseNumber,
      street,
      area,
      landmark: landmark || '',
      city,
      state,
      pincode,
      postalCode: pincode,
      isDefault: shouldBeDefault,
      latitude: latitude || 12.9716,
      longitude: longitude || 77.5946,
    });

    return res.status(201).json(address);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { tag, houseNumber, street, area, landmark, city, state, pincode, isDefault, latitude, longitude } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const address = await Address.findById(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (address.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this address' });
    }

    if (tag !== undefined) address.tag = tag;
    if (houseNumber !== undefined) address.houseNumber = houseNumber;
    if (street !== undefined) address.street = street;
    if (area !== undefined) address.area = area;
    if (landmark !== undefined) address.landmark = landmark;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) {
      address.pincode = pincode;
      address.postalCode = pincode;
    }
    if (latitude !== undefined) address.latitude = latitude;
    if (longitude !== undefined) address.longitude = longitude;

    if (isDefault === true) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
      address.isDefault = true;
    } else if (isDefault === false) {
      // If we are unsetting the only default address, keep it as default
      const defaultCount = await Address.countDocuments({ user: req.user.id, isDefault: true, _id: { $ne: id } });
      if (defaultCount === 0) {
        address.isDefault = true; // Stay default
      } else {
        address.isDefault = false;
      }
    }

    await address.save();
    return res.json(address);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response) => {
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
      return res.status(403).json({ message: 'Not authorized to update this address' });
    }

    await Address.updateMany({ user: req.user.id }, { isDefault: false });

    address.isDefault = true;
    await address.save();

    return res.json(address);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
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

    const wasDefault = address.isDefault;

    await Address.findByIdAndDelete(id);

    // If we deleted the default address, make the next most recent one default
    if (wasDefault) {
      const nextAddress = await Address.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
