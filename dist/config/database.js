"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.isDatabaseConnected = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const DATABASE_NAME = 'CodeDNA';
let isConnected = false;
const connectDatabase = async () => {
    if (isConnected && mongoose_1.default.connection.readyState === 1) {
        return true;
    }
    const uri = env_1.env.MONGODB_URI;
    if (!uri) {
        console.warn('⚠️ MONGODB_URI is not defined in environment variables. Database connection skipped.');
        isConnected = false;
        return false;
    }
    try {
        const conn = await mongoose_1.default.connect(uri, {
            dbName: DATABASE_NAME,
            serverSelectionTimeoutMS: 5000,
            autoIndex: true,
        });
        isConnected = true;
        console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
        return true;
    }
    catch (error) {
        isConnected = false;
        console.error('❌ MongoDB Connection Error:', error instanceof Error ? error.message : error);
        return false;
    }
};
exports.connectDatabase = connectDatabase;
const isDatabaseConnected = () => {
    return mongoose_1.default.connection.readyState === 1;
};
exports.isDatabaseConnected = isDatabaseConnected;
const disconnectDatabase = async () => {
    if (!isConnected && mongoose_1.default.connection.readyState === 0)
        return;
    try {
        await mongoose_1.default.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected successfully.');
    }
    catch (error) {
        console.error('Error disconnecting MongoDB:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
// Handle connection events
mongoose_1.default.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('⚠️ MongoDB connection lost.');
});
mongoose_1.default.connection.on('reconnected', () => {
    isConnected = true;
    console.log('🔄 MongoDB connection restored.');
});
//# sourceMappingURL=database.js.map