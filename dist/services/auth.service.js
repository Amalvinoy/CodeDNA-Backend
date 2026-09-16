"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const env_1 = require("../config/env");
class AuthService {
    static BCRYPT_ROUNDS = 10;
    static TOKEN_EXPIRY = '7d';
    static async hashPassword(password) {
        return await bcryptjs_1.default.hash(password, this.BCRYPT_ROUNDS);
    }
    static async comparePassword(password, hash) {
        return await bcryptjs_1.default.compare(password, hash);
    }
    static generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: this.TOKEN_EXPIRY,
        });
    }
    static verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    }
    static async register(input) {
        const normalizedEmail = input.email.toLowerCase().trim();
        // 1. Check if user already exists
        const existingUser = await models_1.User.findOne({ email: normalizedEmail });
        if (existingUser) {
            const error = new Error('An account with this email already exists.');
            error.statusCode = 409;
            throw error;
        }
        // 2. Hash password
        const passwordHash = await this.hashPassword(input.password);
        // 3. Create user
        const newUser = await models_1.User.create({
            name: input.name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: 'user',
        });
        const userIdStr = newUser._id.toString();
        // 4. Generate token (Genuine new developer with 0 reviews / clean state)
        const token = this.generateToken({
            userId: userIdStr,
            role: newUser.role,
        });
        return {
            user: {
                id: userIdStr,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar,
                role: newUser.role,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt,
            },
            token,
        };
    }
    static async login(input) {
        const normalizedEmail = input.email.toLowerCase().trim();
        // 1. Find user with passwordHash
        const user = await models_1.User.findOne({ email: normalizedEmail }).select('+passwordHash');
        if (!user || !user.passwordHash) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }
        // 2. Compare password
        const isValid = await this.comparePassword(input.password, user.passwordHash);
        if (!isValid) {
            const error = new Error('Invalid email or password.');
            error.statusCode = 401;
            throw error;
        }
        const userIdStr = user._id.toString();
        // 3. Generate token
        const token = this.generateToken({
            userId: userIdStr,
            role: user.role,
        });
        return {
            user: {
                id: userIdStr,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            token,
        };
    }
    static async getCurrentUser(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map