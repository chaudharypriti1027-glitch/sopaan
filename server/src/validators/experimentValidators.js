import { z } from 'zod';
import { CONVERSION_EVENTS } from '../config/experimentsConfig.js';

export const experimentQuerySchema = z.object({
  installId: z.string().trim().min(4).max(128).optional(),
});

export const experimentEventSchema = z.object({
  installId: z.string().trim().min(4).max(128),
  event: z.enum(CONVERSION_EVENTS),
  metadata: z.record(z.unknown()).optional(),
});
