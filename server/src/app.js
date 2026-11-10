import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { csrfProtection } from './middleware/csrf.middleware.js';
import { generalLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.middleware.js';

const app = express();
app.use(generalLimiter);

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Client runs in Vite dev / custom iframe preview
    crossOriginEmbedderPolicy: false,
  })
);

// Strict CORS
app.use(
  cors({
    origin: clientOrigin,
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
    app: 'CodeCanvas API',
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
