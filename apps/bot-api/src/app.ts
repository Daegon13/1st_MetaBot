// src/app.ts
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import instagramRouter from './routes/instagram';
import adminRouter from './routes/admin';

export function createApp() {
  const app = express();
  app.use(cors());

  // 1) Capturamos raw body para verificar firma de Meta correctamente
  app.use(express.json({
    limit: '2mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf; } // <- guardar buffer crudo
  }));

  app.use('/webhook/instagram', instagramRouter);
  app.use('/admin', adminRouter);

  app.use(errorHandler); // al final
  return app;
}
