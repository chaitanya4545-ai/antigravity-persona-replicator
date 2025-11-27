import Joi from 'joi';

// Auth schemas
export const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    }),
});

export const signupSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    }),
    name: Joi.string().min(2).required().messages({
        'string.min': 'Name must be at least 2 characters',
        'any.required': 'Name is required'
    }),
});
