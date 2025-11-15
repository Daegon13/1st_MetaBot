# 1st_MetaBot
Bot de instagram para soporte de servicio al cliente

guía paso a paso para dejar el bot andando con Meta (Instagram DM) + OpenAI + Firebase y lo que hace cada parte del código que te propuse. Está pensada para que la sigas de corrido en local (con ngrok) y con tu DB en Neon.

1) Lo que vas a necesitar antes de empezar

Cuenta de Instagram Profesional vinculada a una Página de Facebook.

App en Meta for Developers (modo Development).

OpenAI API key.

Proyecto Firebase (Firestore) y credenciales de Service Account.

Neon (ya lo tenés) para Postgres.

ngrok para exponer tu localhost.

2) OpenAI (1 minuto)

Crea una API key en https://platform.openai.com/
.

Guárdala para tu .env como OPENAI_API_KEY="sk-...".

3) Firebase (5–8 min)

En Firebase Console → tu proyecto del cliente.

Configuración del proyecto → pestaña Cuentas de servicio → Generar nueva clave privada (JSON).

Abre el JSON y copia:

project_id → FIREBASE_PROJECT_ID

client_email → FIREBASE_CLIENT_EMAIL

private_key → FIREBASE_PRIVATE_KEY (en .env usa el formato con \n escapados, ya lo manejamos en el código).

Crea en Firestore (modo producción) estos documentos básicos:

settings/bot con:

{
  "systemPrompt": "Eres el asistente de Cristal Sagrado...",
  "allowedIntents": 
  "businessHours": {"mon":"10-19","tue":"10-19","sun":"cerrado"},
  "name": "Cristal Sagrado"
}


Algunas entradas de conocimiento en kbEntries con campos title, content, tags (array).

4) Meta (Instagram Messaging) – webhooks y permisos (15–25 min)

Ve a developers.facebook.com → My Apps → tu App → App settings:

Modo Development (para pruebas).

Add Product → Webhooks → Instagram:

Subscribe to this object → messages.

Roles → Instagram Testers:

Agrega la cuenta de IG que usarás para enviar mensajes de prueba (y acéptalo desde esa cuenta).

Página de Facebook:

Debe estar vinculada a tu cuenta IG profesional.

En Graph API Explorer o en Tools → Access Token, obtén un Page Access Token con permisos:

instagram_manage_messages

pages_manage_metadata

pages_read_engagement

instagram_basic

Para Development basta con que el usuario (tú) sea admin de la página y tester de la app.

Verificación del webhook (lo harás después de levantar ngrok; más abajo está el paso).

5) Variables de entorno (apps/bot-api/.env)

Crea/actualiza este archivo (en apps/bot-api, no en la raíz del monorepo):

# Meta / IG
META_VERIFY_TOKEN="un-token-unico-que-eliges"
META_PAGE_ACCESS_TOKEN="EAAB...TOKEN_DE_LA_PAGINA"
# (opcionales si los usas en tu código)
META_APP_SECRET="tu_app_secret"

# OpenAI
OPENAI_API_KEY="sk-..."

# Firebase
FIREBASE_PROJECT_ID="cliente-proyecto"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@cliente-proyecto.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...TU_LLAVE...\n-----END PRIVATE KEY-----\n"

# Postgres (Neon)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxxxx.neon.tech/neondb?sslmode=require"

6) Arranque local del servidor + ngrok (5 min)

Desde apps/bot-api:

npm i
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev


Deberías ver Server on :3000 o similar.

En otra terminal, corre:

ngrok http 3000


Copia la URL pública HTTPS que te da, por ejemplo: https://abcd-xx-xx-xx.ngrok-free.app

7) Conectar el Webhook en Meta (3 min)

En tu App de Meta → Webhooks → Instagram → Edit Subscription:

Callback URL: https://abcd-...ngrok.../webhook

Verify Token: el META_VERIFY_TOKEN que pusiste en .env.

Guarda. Debe mostrar Verified.

En esa misma pantalla, Subscribe to the field: messages. (Si no lo hiciste antes).

8) Probar el flujo (5 min)

Desde la cuenta tester de Instagram, envía un DM a la cuenta business (la asociada a tu página).

Deberías ver en tu consola del server que llegó un POST /webhook.

El bot debe responder con un texto generado (GPT + contexto Firestore).

9) Qué hace cada sección del código (mapa rápido)

src/server.ts

Arranca Express, configura rawBody (para verificar firma opcional) y monta el router de Meta.

Endpoint / simple para health-check.

src/webhook/meta.ts

GET /webhook: responde el reto de verificación de Meta con tu META_VERIFY_TOKEN.

POST /webhook: recibe eventos de Instagram (mensajes entrantes), extrae from y text, y llama a handleIncomingMessage.

(Opcional) verifySignature(): valida la cabecera X-Hub-Signature-256 con tu META_APP_SECRET. Úsalo en producción.

src/meta/send.ts

sendIGText(to, text): envía un texto a un usuario de IG via Graph (/me/messages?access_token=PAGE_TOKEN).

src/data/firestore.ts

Inicializa Firebase Admin usando tu Service Account (desde variables de entorno).

getBusinessContext(): lee settings/bot y (si querés) datos de clients.

matchKB(q): trae kbEntries y hace un matching simple por coincidencia de texto/tags (MVP).

src/bot/handler.ts

Orquesta el flujo:

Trae contexto del negocio y notas relevantes (kbEntries) de Firestore.

Construye el prompt (mensaje del sistema) con límites/horarios/tono.

Llama a OpenAI (chat.completions) para generar la respuesta.

Envía la respuesta al usuario por Instagram con sendIGText.

Extra (recomendado): Prisma (conexión a Postgres en Neon). Úsalo para logs/métricas de conversaciones, estado de sesión, conteos, etc. El helper típico:
src/infra/prisma/client.ts con el patrón singleton para tsx watch.

10) Qué incorporamos con este código (MVP funcional)

Webhook Instagram listo (verificación + recepción de mensajes).

Respuesta automática combinando:

Contexto de negocio desde Firestore (horarios, tono, textos).

Generación con OpenAI (GPT).

Envío por Graph API de Meta.

Estructura para crecer:

Puedes agregar intents, flows, botones rápidos (IG tiene límites), logs en Postgres, RAG con embeddings, etc.

11) Pruebas y señales de que todo va bien

En consola ves POST /webhook cuando mandas un DM.

No hay errores 400/403 desde el sendIGText (si los hay, suele ser token/permiso).

Prisma Studio muestra tablas/migraciones OK (aunque para el MVP no es obligatorio usarlas).

12) Problemas comunes y soluciones rápidas

Webhook no verifica → META_VERIFY_TOKEN distinto al que pones en Meta, o URL de ngrok mal.

No llegan eventos → La cuenta que manda el DM debe ser tester de la App, y la cuenta de destino debe ser IG Business vinculada a la Página.

403 al enviar mensaje → META_PAGE_ACCESS_TOKEN incorrecto o sin permisos, o escribes a un ID que no es el del usuario que te envió (usa m.from del webhook).

OpenAI error/timeout → revisa OPENAI_API_KEY, latencia, o agrega un fallback (mensaje genérico amable).

Firebase private_key mal formateada → asegúrate de los saltos de línea \n en .env.

13) Siguientes mejoras (cuando el MVP ya responde)

RAG real: indexar kbEntries con embeddings y buscar top-k (pgvector en Neon o proveedor vectorial).

Intents/flows: clasificar la consulta (agenda/precios/servicios) y rutear a respuestas más precisas.

Admin Panel: CRUD de kbEntries y settings/bot.

Analítica: guardar en Postgres quién preguntó qué, tiempos de respuesta, intent detectado, etc.

Seguridad: valida X-Hub-Signature-256 siempre en prod, rate limiting y deduplicación de eventos.