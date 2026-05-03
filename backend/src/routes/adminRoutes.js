import { Router } from "express";
import { createUser, listUsers, updateUser } from "../controllers/adminController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = Router();

router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);

export default router;
