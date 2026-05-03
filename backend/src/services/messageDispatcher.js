import { sendTemplateMessage, sendMetaMessage } from "./whatsappService.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const renderMessage = (template, contact) =>
  template
    .replace(/\{\{nombre\}\}/gi, contact.name || "")
    .replace(/\{\{phone\}\}/gi, contact.phone || "");

const sendInternal = async ({ contact, campaign }) => {
  const result = await sendTemplateMessage(
    contact.phone,
    campaign.templateId || "internal_template",
    [contact.name],
    { message: campaign.message },
  );
  return { status: "sent", provider: "internal", result };
};

const sendMetaApi = async ({ contact, campaign, credentials }) => {
  const message = renderMessage(campaign.message, contact);
  const result = await sendMetaMessage(contact.phone, message, credentials);
  return { status: "sent", provider: "meta_api", result };
};

const CHANNEL_HANDLERS = {
  internal: sendInternal,
  meta_api: sendMetaApi,
};

export const dispatchCampaign = async ({
  contacts,
  campaign,
  credentials = null,
  onProgress,
  batchSize = 50,
  maxRetries = 2,
}) => {
  const handler = CHANNEL_HANDLERS[campaign.channel] || CHANNEL_HANDLERS.internal;
  const results = [];

  for (let offset = 0; offset < contacts.length; offset += batchSize) {
    const batch = contacts.slice(offset, offset + batchSize);
    for (const contact of batch) {
      let attempt = 0;
      let finalResult = null;
      while (attempt < maxRetries) {
        attempt += 1;
        try {
          const sent = await handler({ contact, campaign, credentials });
          finalResult = { ...sent, contact, attempt };
          break;
        } catch (error) {
          finalResult = {
            status: "failed",
            provider: campaign.channel || "internal",
            error: error.message,
            contact,
            attempt,
          };
        }
      }

      results.push(finalResult);
      if (onProgress) onProgress(results.length, contacts.length);
      // Respetar rate limit de Meta (~80 msg/s max)
      await sleep(80);
    }
  }

  return results;
};
