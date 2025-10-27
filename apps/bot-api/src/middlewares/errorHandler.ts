// src/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware de manejo de errores (último en la cadena)
 * Devuelve JSON consistente y evita crasheos por errores no controlados
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log mínimo (puedes reemplazar por pino/winston)
  console.error('[error]', err);

  const status =
    typeof err === 'object' && err && 'status' in err && typeof (err as any).status === 'number'
      ? (err as any).status
      : 500;

  const message =
    typeof err === 'object' && err && 'message' in err
      ? String((err as any).message)
      : 'Internal Server Error';

  res.status(status).json({
    ok: false,
    error: {
      message,
      // agrega un code si lo manejas en tu dominio
    },
  });
}
