// Verifica X-Hub-Signature-256 para garantizar integridad del payload (Instagram/Meta)
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function verifySignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.get('x-hub-signature-256');
  const appSecret = process.env.META_APP_SECRET; // configura el App Secret de tu app de Meta
  if (!appSecret || !signature) return next(); // hazlo estricto en producción

  const hmac = crypto.createHmac('sha256', appSecret);
  const payload = JSON.stringify(req.body);
  hmac.update(payload, 'utf8');
  const expected = `sha256=${hmac.digest('hex')}`;

  try {
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return next();
  } catch {}
  return res.sendStatus(403);
}
