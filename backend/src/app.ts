import 'express-async-errors';
import express from 'express';
import { healthRouter } from './health/health.router';
import { authRouter } from './auth/auth.router';

// 合成ルート（ADR-0011）。ここだけが具象を組み立てる。
export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  app.use(authRouter);
  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`backend listening on ${port}`);
  });
}
