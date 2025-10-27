// Crea la app Express, aplica middlewares comunes y monta routers
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import whatsappRouter from './routes/whatsapp';
import adminRouter from './routes/admin';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.use('/webhook/whatsapp', whatsappRouter);
  app.use('/admin', adminRouter);

  app.use(errorHandler);
  return app;
}
