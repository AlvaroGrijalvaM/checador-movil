import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
});

/**
 * Normaliza el resultado de `pool.query` en un array de filas.
 *
 * Con `createPool`, una consulta SELECT devuelve [filas, metadatos], pero un
 * `CALL procedimiento()` con varios result-sets devuelve `[ [filas, meta], [filas2, meta2], ... ]`.
 * Esta funcion detecta ambas formas usando los metadatos del driver ('fieldCount' numerico).
 */
function rowsFromQuery(q) {
  if (!Array.isArray(q) || q.length === 0) return q;

  let rs = q;
  // Caso CALL multi-result-set: q[0] == [filas, metadatos]
  if (Array.isArray(q[0]) && q[0].length >= 2 && typeof q[0][1]?.fieldCount === 'number') {
    rs = q[0];
  }
  // rs puede ser [filas, metadatos] o directamente las filas
  if (Array.isArray(rs) && rs.length >= 2 && typeof rs[1]?.fieldCount === 'number') {
    return rs[0];
  }
  return rs;
}

/** Ejecuta un stored procedure / SELECT y devuelve las filas del primer result-set. */
export async function callRows(sql, params = []) {
  return rowsFromQuery(await pool.query(sql, params));
}

/** Ejecuta un stored procedure / SELECT y devuelve la primera fila (o null). */
export async function callRow(sql, params = []) {
  const rows = rowsFromQuery(await pool.query(sql, params));
  return (Array.isArray(rows) ? rows[0] : null) ?? null;
}

/** Comprueba la conexion con MySQL (para /api/health). */
export async function ping() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}