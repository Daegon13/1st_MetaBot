// src/app.ts
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import instagramRouter from './routes/instagram';
import adminRouter from './routes/admin';
import { rateLimit } from './middlewares/rateLimit';

export function createApp() {
  const app = express();

  // 1) CORS básico para permitir que un panel admin futuro consuma esta API.
  app.use(cors());

  // 2) Limitamos el número de requests hacia el webhook para evitar floods.
  app.use('/webhook/instagram', rateLimit({ windowMs: 60_000, max: 30 }));

  // 3) Capturamos raw body para poder verificar la firma de Meta correctamente.
  app.use(express.json({
    limit: '2mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf; }, // <- guardar buffer crudo
  }));

  // 4) Endpoints principales del bot.
  app.use('/webhook/instagram', instagramRouter);
  app.use('/admin', adminRouter);

  // 5) Health-check simple para saber si el container está vivo.
  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'bot-api' });
  });

  // 6) Middleware de errores (siempre al final).
  app.use(errorHandler);

  return app;
}
