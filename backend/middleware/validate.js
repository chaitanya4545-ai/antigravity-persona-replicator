import logger from '../utils/logger.js';

// Validation middleware factory for Joi
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Get all errors, not just the first one
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            logger.warn('Validation failed', {
                path: req.path,
                errors: error.details
            });

            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        // Replace req.body with validated value
        req.body = value;
        next();
    };
};
