import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const here = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(here, '..');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'checador_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'checador_dev_secret_cambiar',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  },
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000').replace(/\/+$/, ''),
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
};