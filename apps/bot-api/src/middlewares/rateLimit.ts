// src/middlewares/rateLimit.ts
import type { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs?: number; // Ventana de tiempo en milisegundos
  max?: number;      // Máximo de peticiones permitidas por ventana
}

// Almacén en memoria de contadores por IP.
// Para producción real podrías mover esto a Redis u otro store compartido.
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Crea un middleware de rate limiting muy simple, suficiente para:
 * - Evitar floods accidentales
 * - Proteger el endpoint del webhook
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs ?? 60_000; // 1 minuto por defecto
  const max = options.max ?? 30;              // 30 requests/IP/minuto

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'global';
    const now = Date.now();

    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      // Primera petición o ventana expirada -> reiniciamos contador
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        ok: false,
        error: { message: 'Demasiadas peticiones, intenta de nuevo en unos segundos.' },
      });
    }

    return next();
  };
}
