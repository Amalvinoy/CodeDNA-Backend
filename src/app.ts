import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

const app: Application = express();

// Normalize Frontend URL (trim and strip trailing slashes for strict CORS matching)
const normalizedFrontendUrl = (env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: normalizedFrontendUrl,
    credentials: true,
  })
);

// Logging & Parsing
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lightweight Root & Cloud Run Health Probes (no auth, no DB hit)
app.get(['/', '/healthz'], (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api', routes);

// 404 & Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
