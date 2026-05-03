import { Router } from "express";
import multer from "multer";
import {
  createContact,
  deleteContact,
  importContacts,
  listImportJobs,
  listContactTags,
  listContacts,
  listGroups,
  previewImportContacts,
} from "../controllers/contactController.js";

const router = Router();
const upload = multer({
  limits: { fileSize: 6 * 1024 * 1024 },
});

router.get("/", listContacts);
router.post("/", createContact);
router.post("/import/preview", upload.single("file"), previewImportContacts);
router.post("/import", upload.single("file"), importContacts);
router.get("/import-jobs", listImportJobs);
router.delete("/:id", deleteContact);
router.get("/groups", listGroups);
router.get("/tags", listContactTags);

export default router;
