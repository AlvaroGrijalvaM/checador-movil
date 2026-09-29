import { Router } from 'express';
import { callRow, callRows } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { errorMessage } from '../utils/errors.js';

export const empleadosRouter = Router();

// Todas las rutas de empleados requieren un token JWT de rol 'empleado'.
empleadosRouter.use(verifyToken, requireRole('empleado'));

function mayBeMiembro(req, res, numero) {
  if (req.auth.numero !== numero) {
    res.status(403).json({ exito: false, mensaje: 'El numero no corresponde a tu sesion.' });
    return false;
  }
  return true;
}

/** GET /api/empleados/:numero */
empleadosRouter.get('/:numero', async (req, res) => {
  const numero = req.params.numero;
  if (!mayBeMiembro(req, res, numero)) return;
  try {
    const row = await callRow('CALL sp_obtener_empleado_numero(?)', [numero]);
    if (!row) return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/** GET /api/empleados/:numero/estado */
empleadosRouter.get('/:numero/estado', async (req, res) => {
  const numero = req.params.numero;
  if (!mayBeMiembro(req, res, numero)) return;
  try {
    const row = await callRow('CALL sp_estado_checada_numero(?)', [numero]);
    if (!row) return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    return res.json(row);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

async function obtenerIdEmpleado(numero) {
  const row = await callRow('CALL sp_obtener_empleado_numero(?)', [numero]);
  return row?.id_empleado ?? null;
}

/** POST /api/empleados/:numero/entrada { foto_url } */
empleadosRouter.post('/:numero/entrada', async (req, res) => {
  const numero = req.params.numero;
  if (!mayBeMiembro(req, res, numero)) return;
  const fotoUrl = req.body?.foto_url ?? null;
  try {
    const idEmpleado = await obtenerIdEmpleado(numero);
    if (!idEmpleado) return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    const row = await callRow('CALL sp_registrar_entrada(?, ?)', [idEmpleado, fotoUrl]);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/** POST /api/empleados/:numero/salida { foto_url } */
empleadosRouter.post('/:numero/salida', async (req, res) => {
  const numero = req.params.numero;
  if (!mayBeMiembro(req, res, numero)) return;
  const fotoUrl = req.body?.foto_url ?? null;
  try {
    const idEmpleado = await obtenerIdEmpleado(numero);
    if (!idEmpleado) return res.status(404).json({ exito: false, mensaje: 'Empleado no encontrado.' });
    const row = await callRow('CALL sp_registrar_salida(?, ?)', [idEmpleado, fotoUrl]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/** GET /api/empleados/:numero/historial */
empleadosRouter.get('/:numero/historial', async (req, res) => {
  const numero = req.params.numero;
  if (!mayBeMiembro(req, res, numero)) return;
  try {
    const rows = await callRows('CALL sp_historial_empleado_numero(?)', [numero]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});