import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/** Verifica el header `Authorization: Bearer <token>` y deja el payload en req.auth. */
export function verifyToken(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ exito: false, mensaje: 'Token requerido.' });
  }
  try {
    req.auth = jwt.verify(token, config.jwt.secret);
    return next();
  } catch {
    return res.status(401).json({ exito: false, mensaje: 'Token invalido o expirado.' });
  }
}

/** Restringe la ruta a uno o mas roles ('empleado' | 'admin'). */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.rol)) {
      return res.status(403).json({ exito: false, mensaje: 'No autorizado para esta operacion.' });
    }
    return next();
  };
}