import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(5).max(160),
  businessName: z.string().trim().max(160).optional().default(""),
  service: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(3000),
  consent: z.boolean().refine(Boolean, "Persetujuan diperlukan."),
  sourceUrl: z.string().url().max(1000).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;
