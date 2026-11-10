import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { csrfProtection } from './middleware/csrf.middleware.js';
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.middleware.js';

const app = express();

// Trust reverse proxy for secure cookies on Render / Railway / Heroku
app.set('trust proxy', 1);

app.use(generalLimiter);

const rawClientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...rawClientOrigin.split(',').map((s) => s.trim()),
].filter(Boolean);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Client runs in Vite dev / custom iframe preview
    crossOriginEmbedderPolicy: false,
  })
);

// Flexible and secure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '6mb' })); // 5MB project limit + overhead

// CSRF check on state-changing API endpoints
app.use('/api', csrfProtection);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'WebForge API',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Mount API routers
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import aiRouter from './routes/ai.js';

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/ai', aiRouter);

export default app;
