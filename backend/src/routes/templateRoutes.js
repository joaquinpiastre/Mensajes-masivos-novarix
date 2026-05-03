import { Router } from "express";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "../controllers/templateController.js";

const router = Router();

router.get("/", listTemplates);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
