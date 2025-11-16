import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { createLogger } from './logger.js';

const app = express();
const logger = createLogger();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN ? [env.FRONTEND_ORIGIN] : undefined,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.use('/api', router);
app.use(errorHandler);

export default app;
