import express from 'express';
import { addOrderItems, verifyPayment, getOrders, getMyOrders, getOrderById, updateOrderToPaid, updateOrderToDelivered } from '../controllers/orderController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/payment/verify').post(protect, verifyPayment);

export default router;