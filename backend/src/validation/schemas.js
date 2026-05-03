import { z } from "zod";

export const contactCreateSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  group: z.string().trim().optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).optional(),
  customFields: z.record(z.string(), z.string()).optional(),
  optIn: z.boolean().optional(),
});

export const importPreviewSchema = z.object({
  mapping: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      group: z.string().optional(),
      tags: z.string().optional(),
    })
    .partial()
    .optional(),
});

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(3),
  message: z.string().trim().min(3),
  mode: z.enum(["manual", "automatic"]).default("manual"),
  templateId: z.string().trim().optional().or(z.literal("")),
  audienceRules: z
    .object({
      groups: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      optInOnly: z.boolean().optional(),
      search: z.string().optional(),
    })
    .partial()
    .optional(),
  channel: z.enum(["internal", "meta_api"]).default("internal"),
  scheduledAt: z.string().datetime().optional(),
});

export const audiencePreviewSchema = z.object({
  groups: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  optInOnly: z.boolean().optional(),
  search: z.string().optional(),
});
