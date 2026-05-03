import { normalizeArPhone } from "../utils/phone.js";

const META_API_VERSION = process.env.META_API_VERSION || "v21.0";

// credentials = { phoneNumberId, accessToken }
export const sendMetaMessage = async (phone, message, credentials) => {
  const { phoneNumberId, accessToken } = credentials || {};
  if (!phoneNumberId || !accessToken) {
    throw new Error("Configuracion de WhatsApp incompleta. Guarda tus credenciales en Configuracion → WhatsApp.");
  }

  const normalizedPhone = normalizeArPhone(phone);
  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "text",
      text: { preview_url: false, body: message },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Meta API error ${response.status}`;
    throw new Error(errorMsg);
  }

  return {
    provider: "meta_api",
    messageId: data.messages?.[0]?.id || null,
    status: "sent",
    to: normalizedPhone,
  };
};

export const sendTemplateMessage = async (phone, templateName, variables = [], options = {}) => {
  const baseMessage = options.message || "Mensaje de campana";
  const renderedMessage = baseMessage.replace("{{nombre}}", variables[0] || "");

  return {
    provider: "internal",
    messageId: `internal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    status: "queued",
    to: phone,
    templateName,
    variables,
    preview: renderedMessage,
    queuedAt: new Date().toISOString(),
  };
};

export const generateManualLink = (phone, message) => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
};

export const bulkSend = async (contacts, templateName, getVariables, onProgress) => {
  const results = [];

  for (let i = 0; i < contacts.length; i += 1) {
    const contact = contacts[i];
    try {
      const vars = getVariables(contact);
      const result = await sendTemplateMessage(contact.phone, templateName, vars, {
        message: contact.message,
      });
      results.push({ phone: contact.phone, status: "sent", result });
    } catch (error) {
      results.push({ phone: contact.phone, status: "failed", error: error.message });
    }

    if (onProgress) onProgress(i + 1, contacts.length);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
};
