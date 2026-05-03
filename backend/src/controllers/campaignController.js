import { prisma } from "../config/prisma.js";
import { previewAudience, getAudienceContacts } from "../services/audienceService.js";
import { dispatchCampaign } from "../services/messageDispatcher.js";
import { generateManualLink } from "../services/whatsappService.js";
import { audiencePreviewSchema, campaignCreateSchema } from "../validation/schemas.js";

const getCampaign = (id, userId) =>
  prisma.campaign.findFirst({
    where: { id, userId },
    include: { logs: { orderBy: { sentAt: "desc" } } },
  });

export const listCampaigns = async (req, res) => {
  const campaigns = await prisma.campaign.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json(campaigns);
};

export const createCampaign = async (req, res) => {
  const payload = campaignCreateSchema.parse(req.body);
  const audience = payload.audienceRules || {};
  const audienceData = await previewAudience(req.user.id, audience);

  const campaign = await prisma.campaign.create({
    data: {
      name: payload.name,
      message: payload.message,
      mode: payload.mode,
      templateId: payload.templateId || null,
      channel: payload.channel,
      audienceRules: audience,
      totalCount: audienceData.total,
      userId: req.user.id,
      createdBy: req.user.id,
      ...(payload.scheduledAt ? { scheduledAt: new Date(payload.scheduledAt) } : {}),
    },
  });
  return res.status(201).json(campaign);
};

export const getCampaignDetail = async (req, res) => {
  const campaign = await getCampaign(req.params.id, req.user.id);
  if (!campaign) return res.status(404).json({ message: "Campana no encontrada" });
  return res.json(campaign);
};

export const previewCampaignLinks = async (req, res) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!campaign) return res.status(404).json({ message: "Campana no encontrada" });

  const contacts = await getAudienceContacts(req.user.id, campaign.audienceRules || {}, 200);

  const links = contacts.map((contact) => ({
    contactId: contact.id,
    name: contact.name,
    phone: contact.phone,
    link: generateManualLink(contact.phone, campaign.message.replace("{{nombre}}", contact.name)),
  }));

  return res.json({ campaignId: campaign.id, links });
};

export const previewAudienceForCampaign = async (req, res) => {
  const rules = audiencePreviewSchema.parse(req.body || {});
  const data = await previewAudience(req.user.id, rules);
  return res.json(data);
};

export const campaignProgress = async (req, res) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    select: {
      id: true,
      status: true,
      totalCount: true,
      sentCount: true,
      failedCount: true,
      logs: {
        orderBy: { sentAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
          provider: true,
          error: true,
          sentAt: true,
        },
      },
    },
  });
  if (!campaign) return res.status(404).json({ message: "Campana no encontrada" });
  return res.json(campaign);
};

export const sendCampaign = async (req, res) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!campaign) return res.status(404).json({ message: "Campana no encontrada" });

  let credentials = null;
  if (campaign.channel === "meta_api") {
    const config = await prisma.whatsappConfig.findUnique({ where: { userId: req.user.id } });
    if (!config || !config.isActive) {
      return res.status(400).json({
        message: "Configura tu cuenta de WhatsApp antes de enviar. Ve a Configuracion → WhatsApp.",
      });
    }
    credentials = { phoneNumberId: config.phoneNumberId, accessToken: config.accessToken };
  }

  const contacts = await getAudienceContacts(req.user.id, campaign.audienceRules || {});
  if (!contacts.length) return res.status(400).json({ message: "No hay contactos para enviar" });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "sending", totalCount: contacts.length },
  });

  const results = await dispatchCampaign({
    contacts,
    campaign,
    credentials,
    onProgress: async (sent, total) => {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { sentCount: sent, totalCount: total },
      });
    },
  });

  const logs = results.map((result) => {
    const contact = result.contact;
    return {
      campaignId: campaign.id,
      phone: contact.phone,
      name: contact?.name || "Sin nombre",
      status: result.status,
      provider: result.provider || campaign.channel || "internal",
      externalId: result.result?.messageId || null,
      attempt: result.attempt || 1,
      error: result.error || null,
    };
  });
  await prisma.messageLog.createMany({ data: logs });

  const sentCount = results.filter((item) => item.status === "sent").length;
  const failedCount = results.filter((item) => item.status !== "sent").length;

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: failedCount ? "failed" : "sent",
      sentCount,
      failedCount,
      sentAt: new Date(),
    },
  });

  return res.json({ sentCount, failedCount, total: results.length });
};
