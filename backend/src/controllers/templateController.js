import { prisma } from "../config/prisma.js";

export const listTemplates = async (req, res) => {
  const templates = await prisma.template.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json(templates);
};

export const createTemplate = async (req, res) => {
  const template = await prisma.template.create({
    data: { ...req.body, userId: req.user.id },
  });
  return res.status(201).json(template);
};

export const updateTemplate = async (req, res) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!template) return res.status(404).json({ message: "Template no encontrado" });

  const updated = await prisma.template.update({
    where: { id: req.params.id },
    data: req.body,
  });
  return res.json(updated);
};

export const deleteTemplate = async (req, res) => {
  const template = await prisma.template.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!template) return res.status(404).json({ message: "Template no encontrado" });

  await prisma.template.delete({ where: { id: req.params.id } });
  return res.status(204).send();
};
