"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const api_routes_1 = __importDefault(require("./api.routes"));
const router = (0, express_1.Router)();
// Health Check
router.use('/', health_routes_1.default);
// Authentication Endpoints (/api/auth/...)
router.use('/auth', auth_routes_1.default);
// User Domain Protected Endpoints (/api/...)
router.use('/', api_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map