import { prisma } from "../config/prisma.js";

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const buildAudienceWhere = (userId, rules = {}) => {
  const groups = asArray(rules.groups);
  const tags = asArray(rules.tags);
  const optInOnly = rules.optInOnly !== false;
  const search = String(rules.search || "").trim();

  const where = {
    userId,
    ...(optInOnly ? { optIn: true } : {}),
  };

  const and = [];
  if (groups.length) and.push({ group: { in: groups } });
  if (tags.length) and.push({ tags: { hasSome: tags } });
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    });
  }

  if (and.length) where.AND = and;
  return where;
};

export const getAudienceContacts = async (userId, rules = {}, take) =>
  prisma.contact.findMany({
    where: buildAudienceWhere(userId, rules),
    ...(take ? { take } : {}),
    orderBy: { createdAt: "desc" },
  });

export const previewAudience = async (userId, rules = {}) => {
  const where = buildAudienceWhere(userId, rules);
  const [total, sample] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, phone: true, group: true, tags: true },
    }),
  ]);

  return { total, sample };
};
