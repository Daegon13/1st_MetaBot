// apps/bot-api/src/services/dialog.service.ts
import { instagramService } from './instagram.service';
import { openaiService } from './openai.service';
import { retrievalService } from './retrieval.service';
import { prisma } from '../infra/prisma/client';
import { detectIntent } from '../domain/policies';

interface InboundArgs {
  fromIg: string;
  text: string;
  clientSlug: string;
}

async function handleInbound({ fromIg, text, clientSlug }: InboundArgs) {
  const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
  if (!client) return;

  const intent = detectIntent(text);
  const kbContext = await retrievalService.buildContext(clientSlug, text, 5);

  const system = [
    `Eres un asistente de ${client.name}.`,
    `Reglas:`,
    `- Saludo breve + captura de datos mínimos (nombre y necesidad).`,
    `- Responde con información oficial de la empresa.`,
    `- Si la consulta excede (precio cerrado, casos especiales), ofrece derivar a humano.`,
    `- Si está fuera de horario, informa y agenda para el siguiente día hábil.`,
    `- Nunca inventes datos: si no está en el contexto, sé transparente.`
  ].join('\n'); // <- importante

  const messages = [
    { role: 'system' as const, content: system },
    { role: 'system' as const, content: `CONOCIMIENTO EMPRESA:\n${kbContext}` },
    { role: 'user' as const, content: text }
  ];

  const answer = await openaiService.chat(messages);
  await instagramService.sendText(fromIg, answer);

  await prisma.contact.upsert({
    where: { waPhone: fromIg }, // cuando quieras: renombrar a igSid en Prisma
    create: { waPhone: fromIg, clientId: client.id, lastIntent: intent },
    update: { lastIntent: intent, lastMessageAt: new Date() }
  });
}

export const dialogService = { handleInbound };
