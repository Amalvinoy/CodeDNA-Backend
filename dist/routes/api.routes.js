"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const api_controller_1 = require("../controllers/api.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protected Review Routes
router.get('/reviews', auth_1.authenticate, api_controller_1.ApiController.getReviews);
router.get('/reviews/:id', auth_1.authenticate, api_controller_1.ApiController.getReviewById);
router.get('/reviews/:id/historical-context', auth_1.authenticate, api_controller_1.ApiController.getReviewHistoricalContext);
router.post('/reviews', auth_1.authenticate, api_controller_1.ApiController.createReview);
router.delete('/reviews/:id', auth_1.authenticate, api_controller_1.ApiController.deleteReview);
// Protected Developer Code DNA Routes
router.get('/dna', auth_1.authenticate, api_controller_1.ApiController.getCodeDna);
router.get('/dna/summary', auth_1.authenticate, api_controller_1.ApiController.getDnaSummary);
router.get('/dna/patterns', auth_1.authenticate, api_controller_1.ApiController.getDnaPatterns);
router.get('/dna/trends', auth_1.authenticate, api_controller_1.ApiController.getDnaTrends);
router.post('/dna/rebuild', auth_1.authenticate, api_controller_1.ApiController.rebuildCodeDna);
// Historical Rules & Engineering Memory
router.get('/historical-rules', auth_1.authenticate, api_controller_1.ApiController.getHistoricalRules);
router.post('/historical-rules/test-search', auth_1.authenticate, api_controller_1.ApiController.testHistoricalSearch);
router.post('/admin/historical-rules/import', auth_1.authenticate, (0, auth_1.requireRole)('admin'), api_controller_1.ApiController.importHistoricalRules);
router.get('/risk', auth_1.authenticate, api_controller_1.ApiController.getRiskPrediction);
router.post('/risk/forecast', auth_1.authenticate, api_controller_1.ApiController.forecastRisk);
router.get('/battle', auth_1.authenticate, api_controller_1.ApiController.getCodeBattle);
router.post('/battle/generate', auth_1.authenticate, api_controller_1.ApiController.generateBattle);
router.post('/battle/defense', auth_1.authenticate, api_controller_1.ApiController.submitDefense);
router.get('/achievements', auth_1.authenticate, api_controller_1.ApiController.getAchievements);
// Protected Developer Settings
router.get('/settings', auth_1.authenticate, api_controller_1.ApiController.getSettings);
router.patch('/settings', auth_1.authenticate, api_controller_1.ApiController.updateSettings);
exports.default = router;
//# sourceMappingURL=api.routes.js.map