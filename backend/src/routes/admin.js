/**
 * Rutas de administracion (requieren JWT rol=admin).
 * Cada endpoint ejecuta el stored procedure correspondiente de checador_db.
 *
 * Patron comun: el primer parametro p_id_admin es el admin autenticado
 * (req.auth.sub) y la base de datos valida que el administrador este activo.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { callRow, callRows } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { errorMessage } from '../utils/errors.js';

export const adminRouter = Router();

adminRouter.use(verifyToken, requireRole('admin'));

function cleanPwd(password) {
  return password ? String(password).trim() : '';
}

async function hashPassword(password) {
  return bcrypt.hashSync(cleanPwd(password), 10);
}

/** -------------------------------------------------------------------- */
/** ADMINISTRADORES */
/** -------------------------------------------------------------------- */

// GET /api/admin/admins
adminRouter.get('/admins', async (req, res) => {
  try {
    const rows = await callRows('CALL sp_listar_admins(?)', [req.auth.sub]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// POST /api/admin/admins { usuario, password, nombre }
adminRouter.post('/admins', async (req, res) => {
  const { usuario, password, nombre } = req.body ?? {};
  try {
    const row = await callRow('CALL sp_crear_admin(?, ?, ?, ?)', [
      req.auth.sub,
      String(usuario ?? ''),
      await hashPassword(password),
      String(nombre ?? ''),
    ]);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// PUT /api/admin/admins/:idAdmin { usuario, nombre }
adminRouter.put('/admins/:idAdmin', async (req, res) => {
  const { usuario, nombre } = req.body ?? {};
  try {
    const row = await callRow('CALL sp_actualizar_admin(?, ?, ?, ?)', [
      req.auth.sub,
      Number(req.params.idAdmin),
      String(usuario ?? ''),
      String(nombre ?? ''),
    ]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// PUT /api/admin/admins/:idAdmin/password { password }
adminRouter.put('/admins/:idAdmin/password', async (req, res) => {
  const { password } = req.body ?? {};
  try {
    const row = await callRow('CALL sp_cambiar_password_admin(?, ?, ?)', [
      req.auth.sub,
      Number(req.params.idAdmin),
      await hashPassword(password),
    ]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// POST /api/admin/admins/:idAdmin/activar | /desactivar
adminRouter.post('/admins/:idAdmin/:accion', async (req, res) => {
  const accion = req.params.accion;
  if (accion !== 'activar' && accion !== 'desactivar') return res.status(404).json({ exito: false, mensaje: 'Accion no valida.' });
  const proc = accion === 'activar' ? 'sp_activar_admin' : 'sp_desactivar_admin';
  try {
    const row = await callRow(`CALL ${proc}(?, ?)`, [req.auth.sub, Number(req.params.idAdmin)]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/** -------------------------------------------------------------------- */
/** DEPARTAMENTOS */
/** -------------------------------------------------------------------- */

// GET /api/admin/departamentos
adminRouter.get('/departamentos', async (req, res) => {
  try {
    const rows = await callRows('CALL sp_listar_departamentos(?)', [req.auth.sub]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// POST /api/admin/departamentos { nombre_departamento, descripcion }
adminRouter.post('/departamentos', async (req, res) => {
  const body = req.body ?? {};
  try {
    const row = await callRow('CALL sp_crear_departamento(?, ?, ?)', [
      req.auth.sub,
      String(body.nombre_departamento ?? ''),
      String(body.descripcion ?? ''),
    ]);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// PUT /api/admin/departamentos/:idDpto
adminRouter.put('/departamentos/:idDpto', async (req, res) => {
  const body = req.body ?? {};
  try {
    const row = await callRow('CALL sp_actualizar_departamento(?, ?, ?, ?)', [
      req.auth.sub,
      Number(req.params.idDpto),
      String(body.nombre_departamento ?? ''),
      String(body.descripcion ?? ''),
    ]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// POST /api/admin/departamentos/:idDpto/activar | /desactivar
adminRouter.post('/departamentos/:idDpto/:accion', async (req, res) => {
  const accion = req.params.accion;
  if (accion !== 'activar' && accion !== 'desactivar') return res.status(404).json({ exito: false, mensaje: 'Accion no valida.' });
  const proc = accion === 'activar' ? 'sp_activar_departamento' : 'sp_desactivar_departamento';
  try {
    const row = await callRow(`CALL ${proc}(?, ?)`, [req.auth.sub, Number(req.params.idDpto)]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/** -------------------------------------------------------------------- */
/** EMPLEADOS (gestion) */
/** -------------------------------------------------------------------- */

// GET /api/admin/empleados
adminRouter.get('/empleados', async (req, res) => {
  try {
    const rows = await callRows('CALL sp_listar_empleados(?)', [req.auth.sub]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// GET /api/admin/empleados/buscar?texto=
adminRouter.get('/empleados/buscar', async (req, res) => {
  const texto = String(req.query.texto ?? '').trim();
  try {
    const rows = await callRows(
      `CALL sp_buscar_empleado(?, ?, ?, ?, ?, ?, ?, ?)`,
      [null, texto ? `%${texto}%` : null, null, null, null, null, null, null],
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// POST /api/admin/empleados
adminRouter.post('/empleados', async (req, res) => {
  const b = req.body ?? {};
  try {
    const row = await callRow('CALL sp_crear_empleado(?, ?, ?, ?, ?, ?, ?, ?)', [
      req.auth.sub,
      String(b.nombre ?? ''),
      String(b.apellido_paterno ?? ''),
      String(b.apellido_materno ?? ''),
      b.id_departamento ?? null,
      await hashPassword(b.password),
      b.foto_url ?? null,
      b.fecha_ingreso ?? null,
    ]);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// PUT /api/admin/empleados/:idEmp
adminRouter.put('/empleados/:idEmp', async (req, res) => {
  const b = req.body ?? {};
  try {
    const row = await callRow('CALL sp_actualizar_empleado(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      req.auth.sub,
      Number(req.params.idEmp),
      String(b.numero_empleado ?? ''),
      String(b.nombre ?? ''),
      String(b.apellido_paterno ?? ''),
      String(b.apellido_materno ?? ''),
      b.id_departamento ?? null,
      b.foto_url ?? null,
      b.fecha_ingreso ?? null,
    ]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// POST /api/admin/empleados/:idEmp/activar | /desactivar
adminRouter.post('/empleados/:idEmp/:accion', async (req, res) => {
  const accion = req.params.accion;
  if (accion !== 'activar' && accion !== 'desactivar') return res.status(404).json({ exito: false, mensaje: 'Accion no valida.' });
  const proc = accion === 'activar' ? 'sp_activar_empleado' : 'sp_desactivar_empleado';
  try {
    const row = await callRow(`CALL ${proc}(?, ?)`, [req.auth.sub, Number(req.params.idEmp)]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// PUT /api/admin/empleados/:idEmp/password { password, numero_empleado }
adminRouter.put('/empleados/:idEmp/password', async (req, res) => {
  const b = req.body ?? {};
  try {
    const row = await callRow('CALL sp_cambiar_password_empleado(?, ?, ?)', [
      req.auth.sub,
      String(b.numero_empleado ?? ''),
      await hashPassword(b.password),
    ]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/** -------------------------------------------------------------------- */
/** HORARIOS */
/** -------------------------------------------------------------------- */

// GET /api/admin/empleados/:idEmp/horarios
adminRouter.get('/empleados/:idEmp/horarios', async (req, res) => {
  try {
    const rows = await callRows('CALL sp_listar_horarios_empleado(?, ?, ?)', [
      req.auth.sub,
      Number(req.params.idEmp),
      null,
    ]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// POST /api/admin/empleados/:idEmp/horarios
adminRouter.post('/empleados/:idEmp/horarios', async (req, res) => {
  const b = req.body ?? {};
  try {
    const row = await callRow('CALL sp_crear_horario(?, ?, ?, ?, ?, ?)', [
      req.auth.sub,
      Number(req.params.idEmp),
      Number(b.dia_semana),
      String(b.hora_entrada ?? '08:00'),
      String(b.hora_salida ?? '17:00'),
      Number(b.tolerancia_minutos ?? 0),
    ]);
    return res.status(201).json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// PUT /api/admin/horarios/:idHorario
adminRouter.put('/horarios/:idHorario', async (req, res) => {
  const b = req.body ?? {};
  try {
    const row = await callRow('CALL sp_actualizar_horario(?, ?, ?, ?, ?, ?)', [
      req.auth.sub,
      Number(req.params.idHorario),
      Number(b.dia_semana),
      String(b.hora_entrada ?? '08:00'),
      String(b.hora_salida ?? '17:00'),
      Number(b.tolerancia_minutos ?? 0),
    ]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// DELETE /api/admin/horarios/:idHorario
adminRouter.delete('/horarios/:idHorario', async (req, res) => {
  try {
    const row = await callRow('CALL sp_eliminar_horario(?, ?)', [req.auth.sub, Number(req.params.idHorario)]);
    return res.json(row);
  } catch (err) {
    return res.status(422).json({ exito: false, mensaje: errorMessage(err) });
  }
});

/** -------------------------------------------------------------------- */
/** REPORTES / CONSULTAS */
/** -------------------------------------------------------------------- */

// GET /api/admin/reportes/fecha?fecha=YYYY-MM-DD
adminRouter.get('/reportes/fecha', async (req, res) => {
  const fecha = String(req.query.fecha ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ exito: false, mensaje: 'Fecha invalida (use YYYY-MM-DD).' });
  }
  try {
    const rows = await callRows('CALL sp_reporte_fecha(?, ?)', [req.auth.sub, fecha]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});

// GET /api/admin/empleados/:numero/historial
adminRouter.get('/empleados/:numero/historial', async (req, res) => {
  try {
    const rows = await callRows('CALL sp_historial_empleado(?, ?)', [req.auth.sub, req.params.numero]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ exito: false, mensaje: errorMessage(err) });
  }
});
