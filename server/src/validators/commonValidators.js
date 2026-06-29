import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{24}$/i, 'Invalid id format');

export const objectIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const emptyQuerySchema = z.object({}).strict();
