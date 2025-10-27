import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import instagramRouter from './routes/instagram';
import adminRouter from './routes/admin';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.use('/webhook/instagram', instagramRouter);
  app.use('/admin', adminRouter);

  app.use(errorHandler);
  return app;
}
