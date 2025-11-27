import Joi from 'joi';

// Chat message schema
export const chatMessageSchema = Joi.object({
    message: Joi.string().min(1).max(5000).required().messages({
        'string.min': 'Message cannot be empty',
        'string.max': 'Message is too long (max 5000 characters)',
        'any.required': 'Message is required'
    }),
});
