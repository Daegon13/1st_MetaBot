// src/controllers/instagram.controller.ts
import type { Request, Response } from 'express';
import { dialogService } from '../services/dialog.service';
import { z } from 'zod';

/**
 * GET /webhook/instagram
 * Meta usa este endpoint solo una vez para verificar el webhook.
 */
export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

/**
 * Esquema mínimo del payload que envía Meta para mensajes de Instagram.
 * Solo modelamos lo que necesitamos: sender.id y message.text.
 */
const webhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      messaging: z
        .array(
          z.object({
            sender: z.object({ id: z.string() }),
            message: z
              .object({
                text: z.string().optional(),
              })
              .optional(),
          }),
        )
        .optional(),
    }),
  ),
});

/**
 * POST /webhook/instagram
 * Recibe los eventos entrantes y los delega al servicio de diálogo.
 */
export async function onWebhookEvent(req: Request, res: Response) {
  const parsed = webhookSchema.safeParse(req.body);

  if (!parsed.success) {
    console.warn('[webhook] payload inesperado', parsed.error.flatten());
    // A Meta le basta con 200; no queremos que reintente en loop por un error de validación
    return res.sendStatus(200);
  }

  const payload = parsed.data;

  for (const entry of payload.entry ?? []) {
    const messagingEvents = entry.messaging ?? [];
    for (const m of messagingEvents) {
      const text = m.message?.text;
      if (!text) continue;

      try {
        await dialogService.handleInbound({
          fromIg: m.sender.id,
          text,
          clientSlug: inferClientFromPage(entry.id),
        });
      } catch (e) {
        console.error('[webhook] error al procesar mensaje', e);
      }
    }
  }

  return res.sendStatus(200);
}

/**
 * Por ahora resolvemos el tenant por pageId "a mano".
 * Más adelante podés mapear pageId -> slug desde la base de datos.
 */
function inferClientFromPage(_pageId: string): string {
  return 'cliente-ejemplo';
}
