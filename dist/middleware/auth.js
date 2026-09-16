"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const auth_service_1 = require("../services/auth.service");
const authenticate = async (req, res, next) => {
    try {
        let token;
        // 1. Check HTTP-only cookie
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // 2. Check Authorization header
        if (!token && req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                token = parts[1];
            }
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.',
            });
        }
        // 3. Verify JWT
        const payload = auth_service_1.AuthService.verifyToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired authentication token.',
        });
    }
};
exports.authenticate = authenticate;
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }
        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `Forbidden. Requires ${role} role permissions.`,
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map