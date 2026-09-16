import { Router, Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbConnected = isDatabaseConnected();

  res.status(200).json({
    success: true,
    service: 'code-dna-backend',
    status: 'healthy',
    database: {
      status: dbConnected ? 'connected' : 'disconnected',
    },
  });
});

export default router;
