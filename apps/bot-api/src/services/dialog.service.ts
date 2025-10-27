// Orquesta: toma inbound IG, decide intent, arma prompt, consulta RAG y responde
import { instagramService } from './instagram.service';
import { openaiService } from './openai.service';
import { retrievalService } from './retrieval.service';
import { prisma } from '../infra/prisma/client';
import { detectIntent } from '../domain/policies';

interface InboundArgs {
  fromIg: string;            // IGSID del usuario
  text: string;
  clientSlug: string;
}

async function handleInbound({ fromIg, text, clientSlug }: InboundArgs) {
  // 1) Contexto de empresa (tenant)
  const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
  if (!client) return;

  // 2) Intent básico
  const intent = detectIntent(text);

  // 3) Contexto KB (RAG)
  const kbContext = await retrievalService.buildContext(clientSlug, text, 5);

  // 4) System prompt con políticas del primer contacto
  const system = [
    `Eres un asistente de ${client.name}.`,
    `Reglas:`,
    `- Saludo breve + captura de datos mínimos (nombre y necesidad).`,
    `- Responde con información oficial de la empresa.`,
    `- Si la consulta excede (precio cerrado, casos especiales), ofrece derivar a humano.`,
    `- Si está fuera de horario, informa y agenda para el siguiente día hábil.`,
    `- Nunca inventes datos: si no está en el contexto, sé transparente.`
  ].join('
');

  const messages = [
    { role: 'system' as const, content: system },
    { role: 'system' as const, content: `CONOCIMIENTO EMPRESA:
${kbContext}` },
    { role: 'user' as const, content: text }
  ];

  // 5) OpenAI
  const answer = await openaiService.chat(messages);

  // 6) Responder por Instagram
  await instagramService.sendText(fromIg, answer);

  // 7) Persistencia del estado/intent
  await prisma.contact.upsert({
    where: { waPhone: fromIg }, // puedes renombrar el campo a igSid en el esquema si prefieres
    create: { waPhone: fromIg, clientId: client.id, lastIntent: intent },
    update: { lastIntent: intent, lastMessageAt: new Date() }
  });
}

export const dialogService = { handleInbound };
```ts
// Orquesta: toma inbound, decide intent, arma prompt, consulta RAG y responde
import { whatsappService } from './whatsapp.service';
import { openaiService } from './openai.service';
import { retrievalService } from './retrieval.service';
import { prisma } from '../infra/prisma/client';
import { detectIntent } from '../domain/policies';

async function handleInbound({ fromWa, text, clientSlug }: { fromWa: string; text: string; clientSlug: string }) {
  // 1) Contexto de empresa (tenant)
  const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
  if (!client) return;

  // 2) Intent básico (cotización, horarios, ubicación, catálogo, humano)
  const intent = detectIntent(text);

  // 3) Construye contexto dinámico desde KB
  const kbContext = await retrievalService.buildContext(clientSlug, text, 5);

  // 4) System prompt con políticas del primer contacto
  const system = [
    `Eres un asistente de ${client.name}.`,
    `Reglas:`,
    `- Saludo breve + captura de datos mínimos (nombre y necesidad).`,
    `- Responde con información oficial de la empresa.`,
    `- Si la consulta excede (precio cerrado, casos especiales), ofrece derivar a humano.`,
    `- Si está fuera de horario, informa y agenda para el siguiente día hábil.`,
    `- Nunca inventes datos: si no está en el contexto, sé transparente.`
  ].join('\n');

  const messages = [
    { role: 'system' as const, content: system },
    { role: 'system' as const, content: `CONOCIMIENTO EMPRESA:\n${kbContext}` },
    { role: 'user' as const, content: text }
  ];

  // 5) Llama a OpenAI
  const answer = await openaiService.chat(messages);

  // 6) Envía respuesta a WhatsApp
  await whatsappService.sendText(fromWa, answer);

  // 7) Persistencia mínima del estado/intent
  await prisma.contact.upsert({
    where: { waPhone: fromWa },
    create: { waPhone: fromWa, clientId: client.id, lastIntent: intent },
    update: { lastIntent: intent, lastMessageAt: new Date() }
  });
}

export const dialogService = { handleInbound };
