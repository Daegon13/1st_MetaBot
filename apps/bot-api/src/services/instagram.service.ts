// Encapsula llamadas al Send API para Instagram (Messenger Platform)
import fetch from 'node-fetch';

/**
 * Estas variables apuntan al Graph API de Meta y a tu página conectada a Instagram.
 * Para producción, asegúrate de que todos estén definidos en el entorno.
 */
const API_BASE = process.env.META_GRAPH_API_BASE!;           // p.ej. https://graph.facebook.com/v20.0
const PAGE_ID = process.env.META_PAGE_ID!;                   // ID de la página vinculada a IG profesional
const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;      // Token con instagram_manage_messages, pages_messaging, etc.

/**
 * Envía un mensaje de texto a un usuario de Instagram por IGSID (sender.id).
 */
async function sendText(toIGSID: string, body: string) {
  if (!API_BASE || !PAGE_ID || !PAGE_TOKEN) {
    console.error('[instagramService] Faltan variables de entorno para llamar al Graph API');
    return;
  }

  const url = `${API_BASE}/${PAGE_ID}/messages`;
  const payload = {
    recipient: { id: toIGSID },
    messaging_type: 'RESPONSE', // respuesta directa a un mensaje entrante
    message: { text: body },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAGE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`IG send error: ${res.status} ${errText}`);
  }
}

export const instagramService = { sendText };
