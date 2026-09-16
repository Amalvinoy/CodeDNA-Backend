"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalRule = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HistoricalRuleMetadataSchema = new mongoose_1.Schema({
    source: { type: String, default: 'Engineering CSV Knowledge Base' },
    category: { type: String, default: 'General' },
    matchPercent: { type: Number, default: 95 },
    occurrenceCount: { type: Number, default: 1 },
    learnedFrom: { type: String, default: 'Production Review Intelligence' },
    lastEnforced: { type: String, default: 'Recently' },
    preventionRate: { type: Number, default: 98 },
    tags: [{ type: String }],
}, { _id: false });
const HistoricalRuleSchema = new mongoose_1.Schema({
    externalId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        index: true,
        trim: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    normalizedDescription: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    embedding: {
        type: [Number],
        default: [],
    },
    metadata: {
        type: HistoricalRuleMetadataSchema,
        default: () => ({}),
    },
}, {
    timestamps: true,
});
// Text search index
HistoricalRuleSchema.index({ normalizedDescription: 'text' });
exports.HistoricalRule = mongoose_1.default.models.HistoricalRule ||
    mongoose_1.default.model('HistoricalRule', HistoricalRuleSchema);
//# sourceMappingURL=HistoricalRule.js.map