import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
      const { openingHours, closingHours, contactPhone, contactEmail } = req.body;

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
        openingHours: openingHours || '09:00',
        closingHours: closingHours || '21:00',
        contactPhone: contactPhone || phone || '',
        contactEmail: contactEmail || email || '',
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
        profilePhoto: user.profilePhoto || '',
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
        profilePhoto: user.profilePhoto || '',
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
        profilePhoto: user.profilePhoto || '',
      },
      retailer,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken,
      resetPasswordExpires
    });

    const resetUrl = `${req.protocol}://${req.get('host') || 'localhost:5173'}/reset-password/${resetToken}`;
    console.log(`\n==================================================`);
    console.log(`🔑 PASSWORD RESET REQUEST FOR: ${email}`);
    console.log(`Link: ${resetUrl}`);
    console.log(`==================================================\n`);

    return res.json({
      message: 'Password reset link generated successfully',
      resetUrl, // Returned for easy local dev testing
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, phone, profilePhoto } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    let retailer = null;
    if (user.role === 'retailer') {
      retailer = await Retailer.findOne({ owner: user._id });
    }

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto || '',
      },
      retailer,
    });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await (user as any).comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
