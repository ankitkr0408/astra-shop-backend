"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const cloudinary_1 = require("../config/cloudinary");
const router = express_1.default.Router();
// Helper middleware to handle both JSON and FormData
const handleProductImages = (req, res, next) => {
    // Check if request has files (multipart/form-data)
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        // Use Cloudinary parser for file uploads
        cloudinary_1.parser.array('images', 10)(req, res, next);
    }
    else {
        // For JSON requests, just continue
        next();
    }
};
router.route('/')
    .get(productController_1.getProducts)
    .post(authMiddleware_1.protect, authMiddleware_1.admin, handleProductImages, productController_1.createProduct);
router.route('/:id')
    .get(productController_1.getProductById)
    .put(authMiddleware_1.protect, authMiddleware_1.admin, handleProductImages, productController_1.updateProduct)
    .delete(authMiddleware_1.protect, authMiddleware_1.admin, productController_1.deleteProduct);
exports.default = router;
