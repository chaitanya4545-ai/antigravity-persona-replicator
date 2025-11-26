import logger from '../utils/logger.js';

// Validation middleware factory
export const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            logger.warn('Validation failed', {
                path: req.path,
                errors: error.errors
            });

            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
    };
};
