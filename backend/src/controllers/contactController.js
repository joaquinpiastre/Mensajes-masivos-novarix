import { prisma } from "../config/prisma.js";
import { parseImportFile, previewImportRows } from "../services/importService.js";
import { normalizeArPhone } from "../utils/phone.js";
import { contactCreateSchema, importPreviewSchema } from "../validation/schemas.js";

export const listContacts = async (req, res) => {
  const { search = "", group = "", tag = "" } = req.query;
  const and = [{ userId: req.user.id }];
  if (group) and.push({ group });
  if (tag) and.push({ tags: { has: tag } });
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: String(search).replace(/\D/g, "") } },
      ],
    });
  }

  const contacts = await prisma.contact.findMany({
    where: { AND: and },
    orderBy: { createdAt: "desc" },
  });
  return res.json(contacts);
};

export const createContact = async (req, res) => {
  const payload = contactCreateSchema.parse(req.body);
  const contact = await prisma.contact.create({
    data: {
      name: payload.name,
      phone: normalizeArPhone(payload.phone),
      group: payload.group || null,
      tags: payload.tags || [],
      customFields: payload.customFields || null,
      optIn: payload.optIn ?? true,
      userId: req.user.id,
    },
  });
  return res.status(201).json(contact);
};

export const previewImportContacts = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV no adjuntado" });
  const parsedBody = importPreviewSchema.parse({
    mapping: req.body?.mapping ? JSON.parse(req.body.mapping) : undefined,
  });
  const rows = parseImportFile(req.file);
  const preview = previewImportRows(rows, parsedBody);
  return res.json(preview);
};

export const importContacts = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Archivo no adjuntado" });
  const parsedBody = importPreviewSchema.parse({
    mapping: req.body?.mapping ? JSON.parse(req.body.mapping) : undefined,
  });
  const rows = parseImportFile(req.file);
  const preview = previewImportRows(rows, parsedBody);

  const validPhones = preview.parsedRows.filter((row) => !row.errors.length).map((row) => row.data.phone);
  const existing = validPhones.length
    ? await prisma.contact.findMany({
        where: { userId: req.user.id, phone: { in: validPhones } },
        select: { phone: true },
      })
    : [];
  const existingSet = new Set(existing.map((item) => item.phone));

  const readyRows = [];
  const invalidRows = [];
  let duplicateRows = 0;
  preview.parsedRows.forEach((row) => {
    if (row.errors.length) {
      invalidRows.push(row);
      return;
    }
    if (existingSet.has(row.data.phone)) {
      duplicateRows += 1;
      invalidRows.push({ ...row, errors: [...row.errors, "Telefono ya existe en la base"] });
      return;
    }
    readyRows.push({
      ...row.data,
      userId: req.user.id,
    });
  });

  if (readyRows.length) {
    await prisma.contact.createMany({ data: readyRows });
  }

  const importJob = await prisma.importJob.create({
    data: {
      userId: req.user.id,
      fileName: req.file.originalname,
      totalRows: preview.totalRows,
      importedRows: readyRows.length,
      invalidRows: invalidRows.length,
      duplicateRows,
      status: "completed",
      errors: invalidRows.slice(0, 50).map((row) => ({
        rowNumber: row.rowNumber,
        errors: row.errors,
      })),
    },
  });

  return res.status(201).json({
    importJobId: importJob.id,
    totalRows: preview.totalRows,
    importedRows: readyRows.length,
    invalidRows: invalidRows.length,
    duplicateRows,
    errors: invalidRows.slice(0, 20).map((row) => ({
      rowNumber: row.rowNumber,
      errors: row.errors,
    })),
  });
};

export const deleteContact = async (req, res) => {
  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!contact) return res.status(404).json({ message: "Contacto no encontrado" });

  await prisma.contact.delete({ where: { id: req.params.id } });
  return res.status(204).send();
};

export const listGroups = async (req, res) => {
  const groups = await prisma.contact.findMany({
    where: { userId: req.user.id, group: { not: null } },
    select: { group: true },
    distinct: ["group"],
  });
  return res.json(groups.map((item) => item.group));
};

export const listContactTags = async (req, res) => {
  const contacts = await prisma.contact.findMany({
    where: { userId: req.user.id },
    select: { tags: true },
  });
  const tags = [...new Set(contacts.flatMap((item) => item.tags || []))];
  return res.json(tags);
};

export const listImportJobs = async (req, res) => {
  const jobs = await prisma.importJob.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return res.json(jobs);
};
