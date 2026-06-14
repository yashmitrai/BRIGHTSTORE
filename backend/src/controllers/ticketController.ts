import { Request, Response } from 'express';
import { Ticket } from '../models/Ticket';
import { AuthRequest } from '../middleware/authMiddleware';

export const createTicket = async (req: AuthRequest, res: Response) => {
  const { category, description } = req.body;

  if (!category || !description) {
    return res.status(400).json({ message: 'Category and description are required' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const ticket = await Ticket.create({
      user: req.user.id,
      category,
      description,
    });

    return res.status(201).json(ticket);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const tickets = await Ticket.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const ticket = await Ticket.findById(id)
      .populate('user', 'name email')
      .populate('replies.sender', 'name role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: (error as Error).message });
  }
};

export const replyTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Reply message is required' });
  }

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
    }

    ticket.replies.push({
      sender: req.user.id as any,
      message,
      createdAt: new Date(),
    });

    if (req.user.role === 'admin' && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(id)
      .populate('user', 'name email')
      .populate('replies.sender', 'name role');

    return res.json(updatedTicket);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();

    return res.json(ticket);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};
