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
exports.createShiprocketOrder = void 0;
const axios_1 = __importDefault(require("axios"));
const shiprocketLogin = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
        });
        return response.data.token;
    }
    catch (error) {
        console.error('Shiprocket Login Error:', error.message);
        throw new Error('Shiprocket Authentication Failed');
    }
});
const createShiprocketOrder = (orderData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = yield shiprocketLogin();
        const response = yield axios_1.default.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', orderData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    }
    catch (error) {
        // console.error('Shiprocket Create Order Error response:', error.response?.data);
        console.error('Shiprocket Create Order Error:', error.message);
        throw new Error('Failed to create order in Shiprocket');
    }
});
exports.createShiprocketOrder = createShiprocketOrder;
