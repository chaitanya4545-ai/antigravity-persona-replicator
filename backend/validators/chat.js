import { z } from 'zod';

// Chat message schema
export const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
});
