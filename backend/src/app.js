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

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173"]
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
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
