// Inicia el servidor en el puerto definido
import { createApp } from './app';

const PORT = process.env.PORT ?? 3000;
createApp().listen(PORT, () => {
  console.log(`[bot-api] running on :${PORT}`);
});
