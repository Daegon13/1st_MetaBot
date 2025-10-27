// Define endpoints de verificación (GET) y recepción de mensajes (POST) para Instagram
import { Router } from 'express';
import { verifyWebhook, onWebhookEvent } from '../controllers/instagram.controller';
import { verifySignature } from '../middlewares/verifySignature';

const router = Router();

// GET para verificación inicial del webhook con META_VERIFY_TOKEN
router.get('/', verifyWebhook);

// POST para eventos entrantes; valida firma X-Hub-Signature-256
router.post('/', verifySignature, onWebhookEvent);

export default router;
