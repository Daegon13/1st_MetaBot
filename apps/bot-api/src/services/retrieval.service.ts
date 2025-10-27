// Construye contexto con documentos del tenant + búsqueda semántica
import { prisma } from '../infra/prisma/client';
import { vectorStore } from '../infra/vectorStore';

async function buildContext(clientSlug: string, userText: string, k = 5) {
  // 1) Localiza el tenant
  const client = await prisma.client.findUnique({ where: { slug: clientSlug } });
  if (!client) return '';

  // 2) Recupera top-k por similitud del vector store (o fallback a keyword)
  const docs = await vectorStore.similaritySearch({ clientId: client.id, query: userText, k });

  // 3) Formatea contexto
  const ctx = docs.map(d => `# ${d.title}\n${d.content}`).join('\n\n---\n');
  return ctx;
}

export const retrievalService = { buildContext };
