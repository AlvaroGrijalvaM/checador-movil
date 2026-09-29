import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { config, PROJECT_ROOT } from '../config.js';

export const uploadsRouter = Router();

const uploadDir = path.resolve(PROJECT_ROOT, config.uploadDir);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

function publicUrl(filename) {
  return `${config.publicBaseUrl}/${config.uploadDir}/${filename}`;
}

/** POST /api/uploads (multipart, campo "foto") -> guarda el archivo y devuelve su URL. */
uploadsRouter.post('/', upload.single('foto'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ exito: false, mensaje: 'Campo multipart "foto" requerido.' });
  }
  return res.status(201).json({ exito: true, url: publicUrl(req.file.filename) });
});

/** POST /api/uploads/base64 { data, filename } -> guarda la foto (base64) y devuelve su URL. */
uploadsRouter.post('/base64', (req, res) => {
  const data = req.body?.data ?? null;
  const filename = req.body?.filename ?? 'foto.jpg';
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ exito: false, mensaje: 'Campo "data" (base64) requerido.' });
  }
  const buffer = Buffer.from(data, 'base64');
  if (!buffer.length || buffer.length > 12 * 1024 * 1024) {
    return res.status(413).json({ exito: false, mensaje: 'Archivo vacio o demasiado grande.' });
  }
  const ext = (path.extname(filename) || '.jpg').toLowerCase();
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(uploadDir, name), buffer);
  return res.status(201).json({ exito: true, url: publicUrl(name) });
});