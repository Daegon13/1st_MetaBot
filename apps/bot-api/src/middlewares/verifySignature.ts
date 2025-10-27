// src/middlewares/verifySignature.ts
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifySignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.get('x-hub-signature-256');
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signature) return next(); // endurecer en prod

  const hmac = crypto.createHmac('sha256', appSecret);
  const payload = JSON.stringify(req.body);
  hmac.update(payload, 'utf8');
  const expected = `sha256=${hmac.digest('hex')}`;

  try {
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return next();
    }
  } catch {
    // fallthrough
  }
  return res.sendStatus(403);
}
