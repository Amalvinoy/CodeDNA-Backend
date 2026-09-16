import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import apiRoutes from './api.routes';

const router = Router();

// Health Check
router.use('/', healthRoutes);

// Authentication Endpoints (/api/auth/...)
router.use('/auth', authRoutes);

// User Domain Protected Endpoints (/api/...)
router.use('/', apiRoutes);

export default router;
