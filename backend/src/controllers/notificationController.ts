import { Response } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/authMiddleware';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};
