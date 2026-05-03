import { prisma } from "../config/prisma.js";
import { CREDIT_PACKAGES, createPaymentPreference } from "../services/mercadopagoService.js";

export const createPreference = async (req, res) => {
  const { packageId } = req.body;
  const preference = await createPaymentPreference(packageId, req.user.id);

  const selectedPackage = CREDIT_PACKAGES.find((pkg) => pkg.id === packageId);
  await prisma.payment.create({
    data: {
      userId: req.user.id,
      amount: selectedPackage.price,
      credits: selectedPackage.credits,
      mpPaymentId: String(preference.id),
      status: "pending",
    },
  });

  return res.json({ initPoint: preference.init_point, preferenceId: preference.id });
};

export const paymentWebhook = async (req, res) => {
  const data = req.body?.data || {};
  const metadata = req.body?.metadata || {};
  if (req.body?.status === "approved" && metadata?.userId && metadata?.credits) {
    await prisma.user.update({
      where: { id: metadata.userId },
      data: { credits: { increment: Number(metadata.credits) } },
    });
  }

  if (data?.id) {
    await prisma.payment.updateMany({
      where: { mpPaymentId: String(data.id) },
      data: { status: req.body?.status || "approved" },
    });
  }

  return res.status(200).json({ ok: true });
};

export const paymentHistory = async (req, res) => {
  const history = await prisma.payment.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json(history);
};
