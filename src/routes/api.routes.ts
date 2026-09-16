import { Router } from 'express';
import { ApiController } from '../controllers/api.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Protected Review Routes
router.get('/reviews', authenticate, ApiController.getReviews);
router.get('/reviews/:id', authenticate, ApiController.getReviewById);
router.get('/reviews/:id/historical-context', authenticate, ApiController.getReviewHistoricalContext);
router.post('/reviews', authenticate, ApiController.createReview);
router.delete('/reviews/:id', authenticate, ApiController.deleteReview);

// Protected Developer Code DNA Routes
router.get('/dna', authenticate, ApiController.getCodeDna);
router.get('/dna/summary', authenticate, ApiController.getDnaSummary);
router.get('/dna/patterns', authenticate, ApiController.getDnaPatterns);
router.get('/dna/trends', authenticate, ApiController.getDnaTrends);
router.post('/dna/rebuild', authenticate, ApiController.rebuildCodeDna);

// Historical Rules & Engineering Memory
router.get('/historical-rules', authenticate, ApiController.getHistoricalRules);
router.post('/historical-rules/test-search', authenticate, ApiController.testHistoricalSearch);
router.post('/admin/historical-rules/import', authenticate, requireRole('admin'), ApiController.importHistoricalRules);

router.get('/risk', authenticate, ApiController.getRiskPrediction);
router.post('/risk/forecast', authenticate, ApiController.forecastRisk);
router.get('/battle', authenticate, ApiController.getCodeBattle);
router.post('/battle/generate', authenticate, ApiController.generateBattle);
router.post('/battle/defense', authenticate, ApiController.submitDefense);

router.get('/achievements', authenticate, ApiController.getAchievements);

// Protected Developer Settings
router.get('/settings', authenticate, ApiController.getSettings);
router.patch('/settings', authenticate, ApiController.updateSettings);

export default router;
