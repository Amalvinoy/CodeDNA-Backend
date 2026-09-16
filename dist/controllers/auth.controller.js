"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const auth_validator_1 = require("../validators/auth.validator");
const env_1 = require("../config/env");
const COOKIE_NAME = 'token';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};
class AuthController {
    static async register(req, res, next) {
        try {
            // 1. Zod Validation
            const parsed = auth_validator_1.registerSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: parsed.error.errors[0]?.message || 'Invalid input data.',
                });
            }
            // 2. Register Service
            const result = await auth_service_1.AuthService.register(parsed.data);
            // 3. Set HTTP-only cookie
            res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);
            // 4. Return safe user data + token
            return res.status(201).json({
                success: true,
                message: 'Registration successful.',
                data: {
                    user: result.user,
                    token: result.token,
                },
            });
        }
        catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            // 1. Zod Validation
            const parsed = auth_validator_1.loginSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: parsed.error.errors[0]?.message || 'Invalid email or password.',
                });
            }
            // 2. Login Service
            const result = await auth_service_1.AuthService.login(parsed.data);
            // 3. Set HTTP-only cookie
            res.cookie(COOKIE_NAME, result.token, COOKIE_OPTIONS);
            // 4. Return safe user data + token
            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: {
                    user: result.user,
                    token: result.token,
                },
            });
        }
        catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            next(error);
        }
    }
    static async logout(_req, res) {
        res.clearCookie(COOKIE_NAME, {
            ...COOKIE_OPTIONS,
            maxAge: 0,
        });
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.',
        });
    }
    static async getCurrentUser(req, res, next) {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.',
                });
            }
            const user = await auth_service_1.AuthService.getCurrentUser(req.user.userId);
            return res.status(200).json({
                success: true,
                data: {
                    user,
                },
            });
        }
        catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message,
                });
            }
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map