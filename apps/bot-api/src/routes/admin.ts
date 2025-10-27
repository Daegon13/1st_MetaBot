// Endpoints REST para subir/actualizar KB del cliente y setear mensajes
import { Router } from 'express';
import { prisma } from '../infra/prisma/client';

const router = Router();

router.post('/client', async (req, res) => {
  // Crea o actualiza un tenant
  const { name, slug, welcomeText } = req.body;
  const client = await prisma.client.upsert({
    where: { slug },
    create: { name, slug, welcomeText },
    update: { name, welcomeText }
  });
  res.json(client);
});

router.post('/kb/:slug', async (req, res) => {
  // Agrega entradas de conocimiento base y (opcional) las indexa en vector store
  const { slug } = req.params;
  const { entries } = req.body as { entries: { title: string; content: string; tags?: string[] }[] };
  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) return res.sendStatus(404);

  const created = [] as any[];
  for (const e of entries) {
    const kb = await prisma.kbEntry.create({ data: { clientId: client.id, title: e.title, content: e.content, tags: e.tags ?? [] } });
    // TODO: enviar a vectorStore.upsert(kb)
    created.push(kb);
  }
  res.json({ ok: true, created: created.length });
});

export default router;
