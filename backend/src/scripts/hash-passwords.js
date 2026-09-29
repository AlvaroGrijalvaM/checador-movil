/**
 * seed:hash - Convierte las contrasenas placeholder de los inserts a hashes bcrypt.
 *
 * Los scripts de checador_db/Inserts.txt guardan contrasenas de prueba en texto
 * plano (ej. 123123) que NO sirven para iniciar sesion real. Este script re-hashea
 * todos los registros de `empleados` y `admin` cuyo hash actual no sea bcrypt.
 *
 * Uso:
 *   npm run seed:hash             (usa la contrasena por defecto: 123123)
 *   SEED_PASSWORD=MiClave npm run seed:hash
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

const defaultPassword = process.env.SEED_PASSWORD ?? '123123';

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection({ ...config.db });
    const hash = await bcrypt.hash(defaultPassword, 10);

    const [empleados] = await conn.query('SELECT id_empleado, numero_empleado, password_hash FROM empleados');
    let n = 0;
    for (const e of empleados ?? []) {
      const current = String(e.password_hash ?? '');
      if (current.startsWith('$2')) continue;
      await conn.query('UPDATE empleados SET password_hash = ? WHERE id_empleado = ?', [hash, e.id_empleado]);
      n += 1;
      console.log(`  empleado ${e.numero_empleado}: contrasena actualizada a bcrypt (${defaultPassword})`);
    }

    const [admins] = await conn.query('SELECT id_admin, usuario, password_hash FROM admin');
    let a = 0;
    for (const admin of admins ?? []) {
      const current = String(admin.password_hash ?? '');
      if (current.startsWith('$2')) continue;
      await conn.query('UPDATE admin SET password_hash = ? WHERE id_admin = ?', [hash, admin.id_admin]);
      a += 1;
      console.log(`  admin ${admin.usuario}: contrasena actualizada a bcrypt (${defaultPassword})`);
    }

    console.log(`\nListo. empleados actualizados: ${n}, administradores actualizados: ${a}.`);
  } catch (err) {
    console.error('Error:', err?.message ?? err);
    process.exitCode = 1;
  } finally {
    await conn?.end().catch(() => {});
  }
}

main();