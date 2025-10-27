// Detección naive de intent para primer contacto
export function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/(precio|costo|tarifa|cuánto)/.test(t)) return 'pricing';
  if (/(horario|abren|cierran)/.test(t)) return 'hours';
  if (/(dirección|ubicación|dónde)/.test(t)) return 'location';
  if (/(catálogo|servicios|lista)/.test(t)) return 'catalog';
  if (/(humano|asesor|agente)/.test(t)) return 'handoff';
  return 'qa';
}
