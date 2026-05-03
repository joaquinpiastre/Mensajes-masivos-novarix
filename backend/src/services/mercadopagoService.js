import { Preference } from "mercadopago";

export const CREDIT_PACKAGES = [
  { id: "pack_500", credits: 500, price: 2500, label: "500 mensajes" },
  { id: "pack_1500", credits: 1500, price: 6500, label: "1500 mensajes" },
  { id: "pack_5000", credits: 5000, price: 18000, label: "5000 mensajes" },
];

const getClient = async () => {
  const { MercadoPagoConfig } = await import("mercadopago");
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
};

export const createPaymentPreference = async (packageId, userId) => {
  const selectedPackage = CREDIT_PACKAGES.find((item) => item.id === packageId);
  if (!selectedPackage) {
    throw new Error("Paquete de creditos invalido");
  }

  const client = await getClient();
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: selectedPackage.id,
          title: selectedPackage.label,
          quantity: 1,
          currency_id: "ARS",
          unit_price: selectedPackage.price,
        },
      ],
      notification_url: `${process.env.APP_URL}/api/payments/webhook`,
      metadata: {
        userId,
        packageId: selectedPackage.id,
        credits: selectedPackage.credits,
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/credits/success`,
        pending: `${process.env.FRONTEND_URL}/credits`,
        failure: `${process.env.FRONTEND_URL}/credits`,
      },
      auto_return: "approved",
    },
  });

  return result;
};
