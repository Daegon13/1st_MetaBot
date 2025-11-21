// src/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware de manejo de errores (último en la cadena).
 * Devuelve JSON consistente y evita crasheos por errores no controlados.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Log mínimo (puedes reemplazar por pino/winston en producción)
  console.error('[error]', err);

  // Por defecto, error interno
  let status = 500;

  // Permitimos que ciertos errores traigan su propio status (p.ej. errores de dominio)
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const maybeStatus = (err as any).status;
    if (typeof maybeStatus === 'number') {
      status = maybeStatus;
    }
  }

  // Errores de validación (por ejemplo zod) -> 400
  if (typeof err === 'object' && err !== null && 'name' in err) {
    if ((err as any).name === 'ZodError') {
      status = 400;
    }
  }

  const message =
    typeof err === 'object' && err && 'message' in err
      ? String((err as any).message)
      : 'Internal Server Error';

  res.status(status).json({
    ok: false,
    error: {
      message,
      // aquí podrías incluir un "code" para distinguir tipos de error desde el frontend
    },
  });
}
