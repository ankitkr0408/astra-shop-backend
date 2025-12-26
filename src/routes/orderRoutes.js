const express = require('express');
const router = express.Router();
const { addOrderItems, verifyPayment, getOrders, getMyOrders, getOrderById, updateOrderToPaid, updateOrderToDelivered } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid); // Using PUT for updates
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/payment/verify').post(protect, verifyPayment);

module.exports = router;
