import { prisma } from "../config/prisma.js";
import { sendMetaMessage } from "../services/whatsappService.js";

// GET /api/whatsapp/config
export const getConfig = async (req, res) => {
  const config = await prisma.whatsappConfig.findUnique({
    where: { userId: req.user.id },
    select: {
      id: true,
      phoneNumberId: true,
      // No devolvemos accessToken completo por seguridad, solo los últimos 6 chars
      accessToken: true,
      verifyToken: true,
      isActive: true,
      updatedAt: true,
    },
  });

  if (!config) return res.json(null);

  return res.json({
    ...config,
    accessToken: `****${config.accessToken.slice(-6)}`,
  });
};

// POST /api/whatsapp/config
export const saveConfig = async (req, res) => {
  const { phoneNumberId, accessToken, verifyToken } = req.body;
  if (!phoneNumberId || !accessToken || !verifyToken) {
    return res.status(400).json({ message: "phoneNumberId, accessToken y verifyToken son requeridos" });
  }

  const config = await prisma.whatsappConfig.upsert({
    where: { userId: req.user.id },
    create: {
      userId: req.user.id,
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
      verifyToken: verifyToken.trim(),
    },
    update: {
      phoneNumberId: phoneNumberId.trim(),
      accessToken: accessToken.trim(),
      verifyToken: verifyToken.trim(),
      isActive: true,
    },
  });

  return res.json({ message: "Configuracion guardada", id: config.id });
};

// POST /api/whatsapp/test
export const testConnection = async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ message: "phone y message son requeridos" });
  }

  const config = await prisma.whatsappConfig.findUnique({ where: { userId: req.user.id } });
  if (!config) {
    return res.status(400).json({ message: "Primero guarda tu configuracion de WhatsApp" });
  }

  const result = await sendMetaMessage(phone, message, {
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken,
  });

  return res.json(result);
};

// GET /webhook  — Meta verifica el webhook con hub.challenge
export const verifyWebhook = async (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe") return res.sendStatus(400);

  // Buscar qué empresa tiene ese verify token
  const config = await prisma.whatsappConfig.findFirst({
    where: { verifyToken: token, isActive: true },
  });

  if (!config) {
    return res.status(403).json({ message: "Token de verificacion invalido" });
  }

  console.log(`[Webhook] Verificado para config ${config.id}`);
  return res.status(200).send(challenge);
};

// POST /webhook — eventos de Meta (delivery, read, mensajes entrantes)
export const receiveWebhookEvent = (req, res) => {
  const body = req.body;

  if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

  // Responder 200 de inmediato para que Meta no reintente
  res.sendStatus(200);

  const entries = body.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;

      if (value.statuses) {
        for (const status of value.statuses) {
          console.log(`[Webhook][${phoneNumberId}] Mensaje ${status.id} → ${status.status}`);
          // TODO: actualizar MessageLog con status.status (delivered, read)
        }
      }

      if (value.messages) {
        for (const msg of value.messages) {
          console.log(`[Webhook][${phoneNumberId}] Mensaje entrante de ${msg.from}: ${msg.text?.body || "(no texto)"}`);
        }
      }
    }
  }
};
