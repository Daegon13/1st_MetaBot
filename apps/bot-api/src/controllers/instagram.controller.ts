// src/controllers/instagram.controller.ts
import type { Request, Response } from 'express';
import { dialogService } from '../services/dialog.service';
import { z } from 'zod';

export function verifyWebhook(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
}

const InstagramEventSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    time: z.number().optional(),
    messaging: z.array(z.object({
      sender: z.object({ id: z.string() }),
      recipient: z.object({ id: z.string() }),
      timestamp: z.number().optional(),
      message: z.object({
        mid: z.string().optional(),
        text: z.string().optional(),
      }).optional(),
      postback: z.any().optional(),
    })).optional(),
  })),
});

export async function onWebhookEvent(req: Request, res: Response) {
  const parsed = InstagramEventSchema.safeParse(req.body);
  if (!parsed.success) return res.sendStatus(200);

  for (const entry of parsed.data.entry) {
    const events = entry.messaging ?? [];
    for (const m of events) {
      if (m.message?.text) {
        await dialogService.handleInbound({
          fromIg: m.sender.id,
          text: m.message.text,
          clientSlug: inferClientFromPage(entry.id),
        });
      }
    }
  }
  return res.sendStatus(200);
}

function inferClientFromPage(_pageId: string): string {
  return 'cliente-ejemplo';
}
