import { Request, Response } from 'express';
import crypto from 'crypto';
import Order from '../models/Order';
import { razorpay } from '../config/razorpay';
import { createShiprocketOrder } from '../utils/shiprocket';

// @desc    Create new order (Initialize Razorpay)
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req: Request, res: Response): Promise<void> => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        try {
            // 1. Create Razorpay Order
            const payment_capture = 1;
            const currency = 'INR';
            const options = {
                amount: totalPrice * 100, // amount in the smallest currency unit
                currency,
                receipt: `receipt_${Date.now()}`,
                payment_capture,
            };

            const razorpayOrder = await razorpay.orders.create(options);

            // 2. Create Order in DB
            const order = new Order({
                user: (req as any).user?._id,
                orderItems,
                shippingAddress,
                paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
                razorpayOrderId: razorpayOrder.id,
                isPaid: false
            });

            const createdOrder = await order.save();

            res.status(201).json({
                order: createdOrder,
                razorpayOrderId: razorpayOrder.id,
                currency: razorpayOrder.currency,
                amount: razorpayOrder.amount
            });

        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Order creation failed', error: error.message });
        }
    }
};

// @desc    Verify Razorpay Payment and Create Shiprocket Order
// @route   POST /api/orders/payment/verify
// @access  Private
const verifyPayment = async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment Success
            const order: any = await Order.findById(orderId).populate('user', 'name email');

            if (order) {
                order.isPaid = true;
                order.paidAt = new Date();
                order.paymentResult = {
                    id: razorpay_payment_id,
                    status: 'success',
                    update_time: new Date().toISOString(),
                    email_address: order.user.email,
                };

                // Prepare Shiprocket Payload
                const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

                const shiprocketPayload = {
                    order_id: order._id.toString(),
                    order_date: date,
                    pickup_location: "Primary",
                    billing_customer_name: order.user.name || "Customer",
                    billing_last_name: "",
                    billing_address: order.shippingAddress.address,
                    billing_address_2: "",
                    billing_city: order.shippingAddress.city,
                    billing_pincode: order.shippingAddress.postalCode,
                    billing_state: "State",
                    billing_country: order.shippingAddress.country,
                    billing_email: order.user.email,
                    billing_phone: order.shippingAddress.phone,
                    shipping_is_billing: true,
                    order_items: order.orderItems.map((item: any) => ({
                        name: item.name,
                        sku: item.product.toString(),
                        units: item.qty,
                        selling_price: item.price,
                        discount: "",
                        tax: "",
                        hsn: ""
                    })),
                    payment_method: "Prepaid",
                    shipping_charges: order.shippingPrice,
                    giftwrap_charges: 0,
                    transaction_charges: 0,
                    total_discount: 0,
                    sub_total: order.totalPrice,
                    length: 10,
                    breadth: 10,
                    height: 10,
                    weight: 0.5
                };

                // Shiprocket integration
                try {
                    const shiprocketResponse = await createShiprocketOrder(shiprocketPayload);
                    order.shiprocketOrderId = shiprocketResponse.order_id;
                    order.shipmentId = shiprocketResponse.shipment_id;
                    order.orderStatus = 'Packed';
                } catch (srError: any) {
                    console.error("Shiprocket Error: ", srError.message);
                }

                const updatedOrder = await order.save();
                res.json({ message: "Payment Success", order: updatedOrder });
            } else {
                res.status(404).json({ message: 'Order not found' });
            }

        } else {
            res.status(400).json({ message: 'Invalid payment signature' });
        }

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
}

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Update order to paid
// @route   GET /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.paymentResult = {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.payer.email_address,
            };

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isDelivered = true;
            order.deliveredAt = new Date();

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ user: (req as any).user?._id });
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name');
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export {
    addOrderItems,
    verifyPayment,
    getOrderById,
    updateOrderToPaid,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
};