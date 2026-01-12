"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.post('/register', authController_1.registerUser);
router.post('/login', authController_1.authUser);
router.route('/profile').get(authMiddleware_1.protect, authController_1.getUserProfile);
router.route('/users').get(authMiddleware_1.protect, authMiddleware_1.admin, authController_1.getUsers);
router.route('/users/:id')
    .delete(authMiddleware_1.protect, authMiddleware_1.admin, authController_1.deleteUser)
    .get(authMiddleware_1.protect, authMiddleware_1.admin, authController_1.getUserById)
    .put(authMiddleware_1.protect, authMiddleware_1.admin, authController_1.updateUser);
exports.default = router;
