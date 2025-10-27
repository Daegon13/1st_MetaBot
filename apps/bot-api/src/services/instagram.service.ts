// Encapsula llamadas al Send API para Instagram (Messenger Platform)
import fetch from 'node-fetch';

const API_BASE = process.env.META_GRAPH_API_BASE!;           // https://graph.facebook.com/v20.0
const PAGE_ID = process.env.META_PAGE_ID!;                   // Página vinculada a IG profesional
const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN!;      // Token con scopes: instagram_manage_messages, pages_messaging, pages_show_list

/**
 * Envía un mensaje de texto a un usuario de Instagram por IGSID (sender.id)
 */
async function sendText(toIGSID: string, body: string) {
  const url = `${API_BASE}/${PAGE_ID}/messages`;
  const payload = {
    recipient: { id: toIGSID },
    messaging_type: 'RESPONSE',         // respuesta a mensaje entrante
    message: { text: body }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAGE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`IG send error: ${res.status} ${errText}`);
  }
}

export const instagramService = { sendText };
