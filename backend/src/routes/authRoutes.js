import { Router } from "express";
import { bootstrapAdmin, login, me, register } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/bootstrap", bootstrapAdmin);
router.post("/login", login);
router.get("/me", authMiddleware, me);

export default router;
