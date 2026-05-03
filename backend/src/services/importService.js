import { parse } from "csv-parse/sync";
import XLSX from "xlsx";
import { normalizeArPhone } from "../utils/phone.js";

const REQUIRED_TARGETS = ["name", "phone"];
const ALLOWED_TARGETS = ["name", "phone", "group", "tags"];

const normalizeHeader = (value = "") =>
  String(value).trim().toLowerCase().replace(/\s+/g, "_");

const pickSource = (mapping = {}, target, fallbackKeys = []) => {
  if (mapping[target]) return mapping[target];
  return fallbackKeys.find(Boolean);
};

const parseCsv = (buffer) =>
  parse(buffer.toString("utf8"), { columns: true, skip_empty_lines: true });

const parseXlsx = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
};

export const parseImportFile = (file) => {
  const name = file?.originalname?.toLowerCase() || "";
  if (name.endsWith(".csv")) return parseCsv(file.buffer);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXlsx(file.buffer);
  throw Object.assign(new Error("Formato no soportado. Usa CSV o XLSX"), { status: 400 });
};

const sanitizeTags = (value) => {
  if (!value) return [];
  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildRow = ({ sourceRow, rowIndex, sourceKeys, existingPhones }) => {
  const name = String(sourceRow[sourceKeys.name] || "").trim();
  const phone = normalizeArPhone(sourceRow[sourceKeys.phone]);
  const group = String(sourceRow[sourceKeys.group] || "").trim() || null;
  const tags = sanitizeTags(sourceRow[sourceKeys.tags]);

  const customFields = {};
  Object.keys(sourceRow).forEach((key) => {
    if (Object.values(sourceKeys).includes(key)) return;
    const normalized = normalizeHeader(key);
    const value = sourceRow[key];
    if (value === undefined || value === null || String(value).trim() === "") return;
    customFields[normalized] = String(value).trim();
  });

  const errors = [];
  if (!name) errors.push("Falta nombre");
  if (!phone || phone.length < 10) errors.push("Telefono invalido");
  if (phone && existingPhones.has(phone)) errors.push("Telefono duplicado");

  return {
    rowNumber: rowIndex + 2,
    sourceRow,
    data: {
      name,
      phone,
      group,
      tags,
      customFields: Object.keys(customFields).length ? customFields : null,
    },
    errors,
  };
};

export const previewImportRows = (rows, options = {}) => {
  const mapping = options.mapping || {};
  const sourceHeaders = rows[0] ? Object.keys(rows[0]) : [];
  const normalizedHeaders = sourceHeaders.reduce((acc, key) => {
    acc[normalizeHeader(key)] = key;
    return acc;
  }, {});

  const sourceKeys = {
    name: pickSource(mapping, "name", [normalizedHeaders.name]),
    phone: pickSource(mapping, "phone", [normalizedHeaders.phone, normalizedHeaders.telefono]),
    group: pickSource(mapping, "group", [normalizedHeaders.group, normalizedHeaders.grupo]),
    tags: pickSource(mapping, "tags", [normalizedHeaders.tags, normalizedHeaders.etiquetas]),
  };

  const missingTargets = REQUIRED_TARGETS.filter((target) => !sourceKeys[target]);
  if (missingTargets.length) {
    throw Object.assign(
      new Error(`Faltan columnas obligatorias: ${missingTargets.join(", ")}`),
      { status: 400 },
    );
  }

  const existingPhones = new Set();
  const parsedRows = rows.map((sourceRow, rowIndex) => {
    const parsed = buildRow({ sourceRow, rowIndex, sourceKeys, existingPhones });
    if (!parsed.errors.length) existingPhones.add(parsed.data.phone);
    return parsed;
  });

  const invalidRows = parsedRows.filter((item) => item.errors.length);
  const validRows = parsedRows.filter((item) => !item.errors.length);

  return {
    allowedTargets: ALLOWED_TARGETS,
    columnsDetected: sourceHeaders,
    sourceKeys,
    totalRows: parsedRows.length,
    validRows: validRows.length,
    invalidRows: invalidRows.length,
    preview: parsedRows.slice(0, 20),
    parsedRows,
  };
};
