import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import whatsappRoutes, { webhookRouter } from "./routes/whatsappRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { adminMiddleware } from "./middleware/adminMiddleware.js";

dotenv.config();

const app = express();

function normalizeOrigin(url) {
  if (!url) return "";
  return url.replace(/\/$/, "");
}

/** Orígenes permitidos: FRONTEND_URL puede ser varios separados por coma; se ignora barra final. */
function corsOriginCallback(origin, callback) {
  const raw = process.env.FRONTEND_URL || "";
  const list = raw
    .split(",")
    .map((s) => normalizeOrigin(s.trim()))
    .filter(Boolean);
  if (list.length === 0) {
    return callback(null, true);
  }
  if (!origin) {
    return callback(null, true);
  }
  const n = normalizeOrigin(origin);
  if (list.includes(n) || /^https?:\/\/localhost(?::\d+)?$/i.test(n)) {
    return callback(null, true);
  }
  return callback(new Error("CORS: origen no permitido"));
}

app.use(cors({ origin: corsOriginCallback, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Webhook de Meta — debe ser publico (sin auth) y estar ANTES del authMiddleware
app.use("/webhook", webhookRouter);

app.use("/api/auth", authRoutes);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/api/contacts", authMiddleware, contactRoutes);
app.use("/api/campaigns", authMiddleware, campaignRoutes);
app.use("/api/templates", authMiddleware, templateRoutes);
app.use("/api/whatsapp", authMiddleware, whatsappRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);

app.use((error, _req, res, _next) => {
  if (error?.name === "ZodError") {
    return res.status(400).json({
      message: "Datos invalidos",
      issues: error.issues?.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }
  const status = error.status || 500;
  res.status(status).json({ message: error.message || "Error interno del servidor" });
});

export default app;
