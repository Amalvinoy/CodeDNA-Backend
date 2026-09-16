"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const seed_1 = require("./config/seed");
const PORT = Number(process.env.PORT) || env_1.env.PORT || 5000;
const startServer = async () => {
    // Connect to database
    const connected = await (0, database_1.connectDatabase)();
    if (connected) {
        await (0, seed_1.seedInitialDatabaseData)();
    }
    const server = app_1.default.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Code DNA Backend running on port ${PORT} in ${env_1.env.NODE_ENV} mode`);
        console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
    });
    const handleShutdown = async (signal) => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        server.close(async () => {
            await (0, database_1.disconnectDatabase)();
            console.log('HTTP server closed.');
            process.exit(0);
        });
        setTimeout(() => {
            console.error('Forceful shutdown after timeout.');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
};
startServer().catch((err) => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map