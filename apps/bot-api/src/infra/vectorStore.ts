// Abstracción del almacén vectorial para permitir cambiar de proveedor fácil
export const vectorStore = {
  async similaritySearch({ clientId, query, k }: { clientId: string; query: string; k: number }) {
    // Implementa según tu proveedor; fallback simple: retorna últimas N entradas
    return [] as { id: string; title: string; content: string }[];
  },
  async upsert(entry: { id: string; content: string; clientId: string }) {
    // Genera embedding y sube a tu índice
    return true;
  }
};
