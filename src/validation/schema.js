import { z } from 'zod';

export const GeneratePdfSchema = z
	.object({
		url: z.string().url(),
	})
	.strict();
