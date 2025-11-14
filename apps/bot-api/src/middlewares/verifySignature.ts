// src/middlewares/verifySignature.ts
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifySignature(req: any, res: Response, next: NextFunction) {
  const signature = req.get('x-hub-signature-256');
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signature) return next(); // en prod: endurecer

  const expected = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(req.rawBody) // <- usar buffer crudo
    .digest('hex');

  // timing-safe compare
  const ok = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) return res.sendStatus(403);
  next();
}
