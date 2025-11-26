import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for logs
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace for errors
    if (stack) {
        msg += `\n${stack}`;
    }

    return msg;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        // Console output
        new winston.transports.Console({
            format: combine(
                colorize(),
                logFormat
            )
        }),
        // Error log file
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),
        // Combined log file
        new winston.transports.File({
            filename: 'logs/combined.log'
        })
    ]
});

// If not in production, log to console with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            logFormat
        )
    }));
}

export default logger;
