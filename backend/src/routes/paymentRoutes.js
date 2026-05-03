import { Router } from "express";
import {
  createPreference,
  paymentHistory,
  paymentWebhook,
} from "../controllers/paymentController.js";

const router = Router();

router.post("/create-preference", createPreference);
router.post("/webhook", paymentWebhook);
router.get("/history", paymentHistory);

export default router;
