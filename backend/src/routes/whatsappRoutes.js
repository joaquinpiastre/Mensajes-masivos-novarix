import { Router } from "express";
import {
  getConfig,
  saveConfig,
  testConnection,
  verifyWebhook,
  receiveWebhookEvent,
} from "../controllers/whatsappController.js";

// Rutas protegidas (montadas en /api/whatsapp con authMiddleware)
const router = Router();
router.get("/config", getConfig);
router.post("/config", saveConfig);
router.post("/test", testConnection);

export default router;

// Rutas públicas del webhook (montadas en /webhook, sin auth)
export const webhookRouter = Router();
webhookRouter.get("/", verifyWebhook);
webhookRouter.post("/", receiveWebhookEvent);
