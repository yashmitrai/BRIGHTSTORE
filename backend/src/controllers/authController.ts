import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Retailer } from '../models/Retailer';
import { AuthRequest } from '../middleware/authMiddleware';

const generateToken = (id: string, role: string, email: string, name: string) => {
  return jwt.sign(
    { id, role, email, name },
    process.env.JWT_SECRET || 'brightstoresecretjwtkey123456!',
    { expiresIn: '30d' }
  );
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, phone, storeName, storeAddress, longitude, latitude, category, description } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      phone,
    });

    let retailerInfo = null;

    // If role is retailer, create retailer entry
    if (role === 'retailer') {
      if (!storeName || !storeAddress || !longitude || !latitude || !category) {
        // Delete user if retailer info validation fails to maintain consistency
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          message: 'Retailer profile requires storeName, storeAddress, longitude, latitude, and category',
        });
      }

      const parsedCategory = Array.isArray(category) ? category : category.split(',').map((c: string) => c.trim());

      retailerInfo = await Retailer.create({
        owner: user._id,
        storeName,
        storeAddress,
        location: {
          type: 'Point',
          coordinates: [Number(longitude), Number(latitude)],
        },
        category: parsedCategory,
        description: description || '',
        isVerified: false, // Must be verified by admin
      });
    }

    const token = generateToken(user._id.toString(), user.role, user.email, user.name);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      retailer: retailerInfo,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let retailerInfo = null;
    if (user.role === 'retailer') {
      retailerInfo = await Retailer.findOne({ owner: user._id });
    }

    const token = generateToken(user._id.toString(), user.role, user.email, user.name);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      retailer: retailerInfo,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let retailer = null;
    if (user.role === 'retailer') {
      retailer = await Retailer.findOne({ owner: user._id });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      retailer,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
