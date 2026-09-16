"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
// Rate limiter for authentication attempts (e.g. max 20 requests per 15 minutes)
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: env_1.env.NODE_ENV === 'production' ? 50 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
});
// Authentication endpoints
router.post('/register', authLimiter, auth_controller_1.AuthController.register);
router.post('/login', authLimiter, auth_controller_1.AuthController.login);
router.post('/logout', auth_controller_1.AuthController.logout);
router.get('/me', auth_1.authenticate, auth_controller_1.AuthController.getCurrentUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map