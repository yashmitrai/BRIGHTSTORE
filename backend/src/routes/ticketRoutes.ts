import { Router } from 'express';
import { createTicket, getMyTickets, getAllTickets, getTicketById, replyTicket, updateTicketStatus } from '../controllers/ticketController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect as any, createTicket as any);
router.get('/my', protect as any, getMyTickets as any);
router.get('/', protect as any, getAllTickets as any);
router.get('/:id', protect as any, getTicketById as any);
router.post('/:id/reply', protect as any, replyTicket as any);
router.put('/:id/status', protect as any, updateTicketStatus as any);

export default router;
