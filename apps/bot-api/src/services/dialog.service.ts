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

/**
 * Orquesta todo el flujo de un mensaje entrante:
 * 1) Resuelve el cliente (tenant) por slug
 * 2) Detecta intención básica
 * 3) Construye contexto (empresa + base de conocimiento)
 * 4) Llama a OpenAI para generar la respuesta
 * 5) Envía la respuesta por Instagram
 * 6) Registra / actualiza el contacto en la base de datos
 */
async function handleInbound({ fromIg, text, clientSlug }: InboundArgs) {
  const client = await prisma.client.findUnique({ where: { slug: clientSlug } });

  // Si no existe el cliente simplemente no respondemos, pero evitamos romper el webhook
  if (!client) {
    console.warn('[dialog] client no encontrado para slug', clientSlug);
    return;
  }

  // 1) Intento simple de clasificar la intención del mensaje
  const intent = detectIntent(text);

  // 2) Construimos un bloque de contexto con info del negocio
  const businessContextLines: string[] = [
    `Eres el asistente virtual de la marca "${client.name}".`,
    'Respondes siempre en español, con tono cercano pero profesional.',
    'Si la persona pide hablar con un humano, ofreces derivar a soporte y no inventas datos.',
    `Intención aproximada del mensaje: ${intent}.`,
  ];

  if (client.welcomeText) {
    businessContextLines.push(`Mensaje base de bienvenida de la marca: ${client.welcomeText}`);
  }

  const businessContext = businessContextLines.join('\n');

  // 3) Recuperamos contexto semántico desde la base de conocimiento
  const kbContext = await retrievalService.buildContext(clientSlug, text);

  // 4) Construimos el prompt completo para el modelo
  const messages = [
    { role: 'system' as const, content: businessContext },
    { role: 'system' as const, content: `CONOCIMIENTO EMPRESA:\n${kbContext}` },
    { role: 'user' as const, content: text },
  ];

  // 5) Generamos respuesta con OpenAI
  const answer = await openaiService.chat(messages);

  // 6) Enviamos respuesta por Instagram
  await instagramService.sendText(
    fromIg,
    answer || 'Por el momento no puedo responder, intenta de nuevo en unos minutos.',
  );

  // 7) Persistimos estado mínimo del contacto (para handoff futuro, analytics, etc.)
  // Buscamos si ya existe un contacto con este IG SID para este cliente
const existingContact = await prisma.contact.findFirst({
  where: {
    waPhone: fromIg,
    clientId: client.id
  }
});

if (existingContact) {
  // Si existe, solo actualizamos intención y fecha del último mensaje
  await prisma.contact.update({
    where: { id: existingContact.id },
    data: {
      lastIntent: intent,
      lastMessageAt: new Date()
    }
  });
} else {
  // Si no existe, lo creamos
  await prisma.contact.create({
    data: {
      waPhone: fromIg,
      clientId: client.id,
      lastIntent: intent,
      lastMessageAt: new Date()
    }
  });
}

}

export const dialogService = { handleInbound };
