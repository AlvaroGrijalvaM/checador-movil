# checador-backend

API REST (Node.js + Express + MySQL) para el sistema **Checador Smart Display / TV**.
Cada endpoint consulta o actualiza la base `checador_db` (ver carpeta
`../checador_db`). La hora de entrada/salida **siempre** la define MySQL (`NOW()`), no el cliente.

## Requisitos

- Node.js >= 20
- MySQL >= 8 con la base `checador_db` creada:
  1. Ejecutar `checador_db/Script Completo.txt`
  2. Ejecutar `checador_db/Inserts.txt` (datos de prueba)
  3. `npm run seed:hash` para re-hashear las contrasenas placeholder con bcrypt

## Configuracion

    cp .env.example .env

| Variable | Descripcion | Default |
|---|---|---|
| `PORT` | Puerto HTTP | `4000` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Conexion MySQL | `localhost` / `3306` / `root` / `12345678` / `checador_db` |
| `JWT_SECRET` | Secreto para firmar los JWT | `checador_dev_secret_cambiar` |
| `JWT_EXPIRES_IN` | Vigencia del token | `12h` |
| `PUBLIC_BASE_URL` | URL base para las fotos subidas | `http://localhost:4000` |
| `UPLOAD_DIR` | Carpeta de fotografias | `uploads` |

## Ejecucion

    npm install
    npm run dev       # desarrollo (nodemon)
    npm start         # produccion

## Endpoints

| Metodo | Ruta | Descripcion | Acceso |
|---|---|---|---|
| `GET` | `/api/health` | Estado del servicio y conexion a la base | Publico |
| `POST` | `/api/auth/empleado` | Login del empleado (numero + contrasena) | Publico |
| `POST` | `/api/auth/admin` | Login del administrador (usuario + contrasena) | Publico |
| `GET` | `/api/empleados/:numero` | Datos del empleado | Empleado |
| `GET` | `/api/empleados/:numero/estado` | Estado de la checada del dia | Empleado |
| `POST` | `/api/empleados/:numero/entrada` | Registrar entrada | Empleado |
| `POST` | `/api/empleados/:numero/salida` | Registrar salida | Empleado |
| `GET` | `/api/empleados/:numero/historial` | Historial personal | Empleado |

| `POST` | `/api/uploads` | Subir foto (multipart, campo `foto`) | Publico |
| `POST` | `/api/uploads/base64` | Subir foto (`{ data, filename }`) | Publico |

### Autenticacion

Las rutas de rol *Empleado* y *Admin* requieren el header:

    Authorization: Bearer <token>

Ejemplo de login de empleado:

    POST /api/auth/empleado
    { "numero_empleado": "EMP001", "password": "123123" }

Respuesta:

    { "exito": true, "token": "<jwt>", "empleado": { id_empleado, numero_empleado, nombre_completo, nombre_departamento, ... } }

### Ejemplos de uso

Registrar entrada:

    POST /api/empleados/EMP001/entrada
    Authorization: Bearer <token>
    { "foto_url": "http://localhost:4000/uploads/foto.jpg" }

Salida:

    POST /api/empleados/EMP001/salida
    Authorization: Bearer <token>
    { "foto_url": "http://localhost:4000/uploads/foto.jpg" }

## Notas

- Los errores de validacion del negocio se devuelven tal cual al cliente
  (p. ej. "El empleado ya registro una entrada el dia de hoy.").
- Si los inserts seed todavia tienen contrasenas en texto plano, el login
  devolvera `401` hasta que se ejecute `npm run seed:hash`.
## Panel de administracion (movil)

La app movil ofrece un **apartado de administracion** cuando inicia sesion un
usuario con rol `admin` (usuario: `admin`, contrasena: `123` en los Inserts,
tras `npm run seed:hash` la contrasena pasa a ser `123123` por defecto).

| Metodo | Ruta | Funcion |
|---|---|---|
| `GET` | `/api/admin/admins` | Listar administradores |
| `POST` | `/api/admin/admins` | Crear administrador |
| `PUT` | `/api/admin/admins/:id` | Actualizar administrador |
| `PUT` | `/api/admin/admins/:id/password` | Cambiar contrasena del administrador |
| `POST` | `/api/admin/admins/:id/activar` / `desactivar` | Activar / desactivar administrador |
| `GET` | `/api/admin/departamentos` | Listar departamentos |
| `POST` | `/api/admin/departamentos` | Crear departamento |
| `PUT` | `/api/admin/departamentos/:id` | Actualizar departamento |
| `POST` | `/api/admin/departamentos/:id/activar` / `desactivar` | Activar / desactivar departamento |
| `GET` | `/api/admin/empleados` | Listar empleados |
| `GET` | `/api/admin/empleados/buscar?texto=` | Buscar empleados |
| `POST` | `/api/admin/empleados` | Crear empleado |
| `PUT` | `/api/admin/empleados/:id` | Actualizar empleado |
| `POST` | `/api/admin/empleados/:id/activar` / `desactivar` | Activar / desactivar empleado |
| `PUT` | `/api/admin/empleados/:id/password` | Cambiar contrasena del empleado |
| `GET` | `/api/admin/empleados/:id/horarios` | Listar horarios del empleado |
| `POST` | `/api/admin/empleados/:id/horarios` | Crear horario |
| `PUT` | `/api/admin/horarios/:id` | Actualizar horario |
| `DELETE` | `/api/admin/horarios/:id` | Eliminar horario |
| `GET` | `/api/admin/reportes/fecha?fecha=YYYY-MM-DD` | Reporte por fecha |
| `GET` | `/api/admin/empleados/:numero/historial` | Historial del empleado |

> Todas las rutas `/api/admin/*` requieren el token JWT de rol `admin`
> (obtenido con `POST /api/auth/admin`). Las contrasenas llegan en claro desde
> el cliente y el backend las hashea con bcrypt antes de guardarlas.