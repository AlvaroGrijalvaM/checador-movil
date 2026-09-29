import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[checador-backend] API escuchando en http://localhost:${config.port}`);
  console.log(`[checador-backend] Health check: http://localhost:${config.port}/api/health`);
});