// src/routes/admin.ts
import { Router } from 'express';
import { prisma } from '../infra/prisma/client';

const router = Router();

// Crea/actualiza un cliente (tenant)
router.post('/client', async (req, res) => {
  const { name, slug, welcomeText } = req.body;
  const client = await prisma.client.upsert({
    where: { slug },
    create: { name, slug, welcomeText },
    update: { name, welcomeText }
  });
  res.json(client);
});

// Agrega entradas de conocimiento (KB) a un tenant
router.post('/kb/:slug', async (req, res) => {
  const { slug } = req.params;
  const { entries } = req.body as { entries: { title: string; content: string; tags?: string[] }[] };

  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) return res.sendStatus(404);

  const created = [];
  for (const e of entries) {
    const kb = await prisma.kbEntry.create({
      data: { clientId: client.id, title: e.title, content: e.content, tags: e.tags ?? [] }
    });
    created.push(kb);
    // TODO: vectorStore.upsert({ id: kb.id, content: kb.content, clientId: client.id })
  }
  res.json({ ok: true, created: created.length });
});

export default router;
