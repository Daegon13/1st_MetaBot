// Simplifica el consumo del modelo de chat y embeddings
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CHAT_MODEL = process.env.OPENAI_MODEL!;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL!;

async function chat(messages: { role: 'system'|'user'|'assistant', content: string }[]) {
  const resp = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages,
    temperature: 0.4
  });
  return resp.choices[0]?.message?.content ?? '';
}

async function embed(texts: string[]) {
  const resp = await client.embeddings.create({
    model: EMBED_MODEL,
    input: texts
  });
  return resp.data.map(v => v.embedding);
}

export const openaiService = { chat, embed };
