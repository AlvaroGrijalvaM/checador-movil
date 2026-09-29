import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { callRow } from '../db.js';
import { config } from '../config.js';
import { errorMessage } from '../utils/errors.js';

export const authRouter = Router();

/** Quita el password_hash de la respuesta (nunca debe salir del servidor). */
function sanitize(row) {
  if (!row) return null;
  const out = { ...row };
  delete out.password_hash;
  return out;
}

/**
 * POST /api/auth/empleado
 * body: { numero_empleado, password }
 * Ejecuta el login del empleado y compara el password con bcrypt. Emite JWT de empleado.
 */
authRouter.post('/empleado', async (req, res) => {
  const { numero_empleado, password } = req.body ?? {};
  if (!numero_empleado || !String(numero_empleado).trim()) {
    return res.status(400).json({ exito: false, mensaje: 'El numero de empleado es obligatorio.' });
  }
  try {
    const row = await callRow('CALL sp_login_empleado(?)', [String(numero_empleado).trim()]);
    if (!row) {
      return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado o inactivo.' });
    }
    if (!password || !bcrypt.compareSync(String(password), row.password_hash)) {
      return res.status(401).json({ exito: false, mensaje: 'Contrasena incorrecta.' });
    }
    const token = jwt.sign(
      { sub: row.id_empleado, numero: row.numero_empleado, rol: 'empleado' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );
    return res.json({ exito: true, token, empleado: sanitize(row) });
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/**
 * POST /api/auth/admin
 * body: { usuario, password }
 * Ejecuta el login del administrador y compara el password con bcrypt. Emite JWT de admin.
 */
authRouter.post('/admin', async (req, res) => {
  const { usuario, password } = req.body ?? {};
  if (!usuario || !String(usuario).trim()) {
    return res.status(400).json({ exito: false, mensaje: 'El usuario es obligatorio.' });
  }
  try {
    const row = await callRow('CALL sp_login_admin(?)', [String(usuario).trim()]);
    if (!row || row.activo !== true && row.activo !== 1) {
      return res.status(401).json({ exito: false, mensaje: 'Credenciales invalidas.' });
    }
    if (!password || !bcrypt.compareSync(String(password), row.password_hash)) {
      return res.status(401).json({ exito: false, mensaje: 'Credenciales invalidas.' });
    }
    const token = jwt.sign(
      { sub: row.id_admin, usuario: row.usuario, rol: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );
    return res.json({ exito: true, token, admin: sanitize(row) });
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});