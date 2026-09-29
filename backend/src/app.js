import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { config, PROJECT_ROOT } from './config.js';
import { ping } from './db.js';
import { authRouter } from './routes/auth.js';
import { empleadosRouter } from './routes/empleados.js';

import { adminRouter } from './routes/admin.js';
import { uploadsRouter } from './routes/uploads.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  const uploadsPath = path.resolve(PROJECT_ROOT, config.uploadDir);
  fs.mkdirSync(uploadsPath, { recursive: true });
  app.use(`/${config.uploadDir}`, express.static(uploadsPath));

  // Estado del servicio (utilt para comprobar que la API responde sin MySQL).
  app.get('/api/health', async (_req, res) => {
    res.json({
      ok: true,
      servicio: 'checador-backend',
      db: await ping(),
      hora: new Date().toISOString(),
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/empleados', empleadosRouter);

  app.use('/api/admin', adminRouter);
  app.use('/api/uploads', uploadsRouter);

  // Manejador de errores central.
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ exito: false, mensaje: 'El archivo es demasiado grande.' });
    }
    if (err?.name === 'MulterError') {
      return res.status(400).json({ exito: false, mensaje: err.message });
    }
    console.error('[checador-backend] error:', err);
    return res.status(err?.status ?? 500).json({ exito: false, mensaje: err?.message ?? 'Error interno del servidor.' });
  });

  return app;
}