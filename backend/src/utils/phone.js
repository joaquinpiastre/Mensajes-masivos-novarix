export const normalizeArPhone = (rawPhone = "") => {
  const digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("549")) return digits;
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;
  if (digits.startsWith("9")) return `54${digits}`;

  return `549${digits}`;
};
