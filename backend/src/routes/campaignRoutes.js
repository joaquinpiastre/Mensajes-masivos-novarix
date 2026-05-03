import { Router } from "express";
import {
  campaignProgress,
  createCampaign,
  getCampaignDetail,
  listCampaigns,
  previewAudienceForCampaign,
  previewCampaignLinks,
  sendCampaign,
} from "../controllers/campaignController.js";

const router = Router();

router.get("/", listCampaigns);
router.post("/", createCampaign);
router.post("/audience/preview", previewAudienceForCampaign);
router.get("/:id", getCampaignDetail);
router.get("/:id/progress", campaignProgress);
router.post("/:id/send", sendCampaign);
router.get("/:id/preview", previewCampaignLinks);

export default router;
