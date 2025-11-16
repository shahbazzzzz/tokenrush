import pino from 'pino';

export const createLogger = () =>
  pino({
    name: 'tokenrush-backend',
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          },
  });
