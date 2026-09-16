"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    const dbConnected = (0, database_1.isDatabaseConnected)();
    res.status(200).json({
        success: true,
        service: 'code-dna-backend',
        status: 'healthy',
        database: {
            status: dbConnected ? 'connected' : 'disconnected',
        },
    });
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map