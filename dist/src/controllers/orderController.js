"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = exports.getMyOrders = exports.updateOrderToDelivered = exports.updateOrderToPaid = exports.getOrderById = exports.verifyPayment = exports.addOrderItems = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Order_1 = __importDefault(require("../models/Order"));
const razorpay_1 = require("../config/razorpay");
const shiprocket_1 = require("../utils/shiprocket");
// @desc    Create new order (Initialize Razorpay)
// @route   POST /api/orders
// @access  Private
const addOrderItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice, } = req.body;
    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    }
    else {
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
            const razorpayOrder = yield razorpay_1.razorpay.orders.create(options);
            // 2. Create Order in DB
            const order = new Order_1.default({
                user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, // Assumes auth middleware populates req.user
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
            const createdOrder = yield order.save();
            res.status(201).json({
                order: createdOrder,
                razorpayOrderId: razorpayOrder.id,
                currency: razorpayOrder.currency,
                amount: razorpayOrder.amount
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Order creation failed', error: error.message });
        }
    }
});
exports.addOrderItems = addOrderItems;
// @desc    Verify Razorpay Payment and Create Shiprocket Order
// @route   POST /api/orders/payment/verify
// @access  Private
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto_1.default
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');
        if (expectedSignature === razorpay_signature) {
            // Payment Success
            const order = yield Order_1.default.findById(orderId).populate('user', 'name email');
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
                // Note: date format needs to be YYYY-MM-DD HH:mm:ss
                const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const shiprocketPayload = {
                    order_id: order._id.toString(),
                    order_date: date,
                    pickup_location: "Primary", // Needs to be set in Shiprocket dashboard
                    billing_customer_name: order.user.name || "Customer", // Fallback
                    billing_last_name: "",
                    billing_address: order.shippingAddress.address,
                    billing_address_2: "",
                    billing_city: order.shippingAddress.city,
                    billing_pincode: order.shippingAddress.postalCode,
                    billing_state: "State", // You might need to add state to your address schema
                    billing_country: order.shippingAddress.country,
                    billing_email: order.user.email,
                    billing_phone: order.shippingAddress.phone,
                    shipping_is_billing: true,
                    order_items: order.orderItems.map((item) => ({
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
                    const shiprocketResponse = yield (0, shiprocket_1.createShiprocketOrder)(shiprocketPayload);
                    order.shiprocketOrderId = shiprocketResponse.order_id;
                    order.shipmentId = shiprocketResponse.shipment_id;
                    order.orderStatus = 'Packed'; // Example status update
                }
                catch (srError) {
                    console.error("Shiprocket Error: ", srError.message);
                    // We don't fail the request if Shiprocket fails, but we might want to log it or flag it
                    // The payment is successful regardless.
                }
                const updatedOrder = yield order.save();
                res.json({ message: "Payment Success", order: updatedOrder });
            }
            else {
                res.status(404).json({ message: 'Order not found' });
            }
        }
        else {
            res.status(400).json({ message: 'Invalid payment signature' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Payment verification failed', error: error.message });
    }
});
exports.verifyPayment = verifyPayment;
// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield Order_1.default.findById(req.params.id).populate('user', 'name email');
        if (order) {
            res.json(order);
        }
        else {
            res.status(404).json({ message: 'Order not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getOrderById = getOrderById;
// @desc    Update order to paid
// @route   GET /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield Order_1.default.findById(req.params.id);
        if (order) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.paymentResult = {
                id: req.body.id,
                status: req.body.status,
                update_time: req.body.update_time,
                email_address: req.body.payer.email_address,
            };
            const updatedOrder = yield order.save();
            res.json(updatedOrder);
        }
        else {
            res.status(404).json({ message: 'Order not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateOrderToPaid = updateOrderToPaid;
// @desc    Update order to delivered
// @route   GET /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield Order_1.default.findById(req.params.id);
        if (order) {
            order.isDelivered = true;
            order.deliveredAt = new Date();
            const updatedOrder = yield order.save();
            res.json(updatedOrder);
        }
        else {
            res.status(404).json({ message: 'Order not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateOrderToDelivered = updateOrderToDelivered;
// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const orders = yield Order_1.default.find({ user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getMyOrders = getMyOrders;
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield Order_1.default.find({}).populate('user', 'id name');
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getOrders = getOrders;
