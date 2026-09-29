# checador-movil - Smart Display / TV

Componente movil del sistema de checador con pantalla inteligente (Smart Display / TV).
La app identifica al empleado por su numero, valida su identidad con biometria en el
telefono (huella / rostro) y registra entrada/salida contra la nube (API + MySQL).

## Estructura

| Carpeta        | Descripcion                                                        |
|----------------|--------------------------------------------------------------------|
| `frontend/`    | App movil Expo/React Native (SDK 57) con Expo Router.              |
| `backend/`     | API REST Node.js + Express que ejecuta los stored procedures.      |
| `checador_db/` | Scripts SQL (tablas, procedures e inserts de prueba).              |

## Inicio rapido

### 1. Base de datos (MySQL)

1. Ejecuta `checador_db/Script Completo.txt` (crea la BD, tablas y stored procedures).
2. Ejecuta `checador_db/Inserts.txt` (departamentos, empleados EMP001-EMP010 y checadas de prueba).
3. Re-hashea las contrasenas de prueba con bcrypt (detalle en `backend/README.md`).

### 2. Backend (API)

    cd backend
    npm install
    copy .env.example .env   # configura las credenciales de MySQL
    npm run seed:hash        # convierte las contrasenas placeholder a bcrypt
    npm run dev              # API escuchando en http://localhost:4000

### 3. Frontend (app movil)

    cd frontend
    npm install
    npx expo start

La URL de la API se configura en `frontend/.env` (copiando `frontend/.env.example`):
`EXPO_PUBLIC_API_URL=http://<ip-del-backend>:4000`. En el telefono (Expo Go) usa la
IP LAN de tu computadora, no `localhost`.

> Base de datos local: la conexion por defecto del backend usa MySQL en
> `localhost:3306`, usuario `root` y contrasena `12345678` (ver `backend/.env`).

## Flujo de la app

`sign-in` (numero de empleado) -> identificacion del empleado -> verificacion
biometrica (huella/rostro del dispositivo) -> panel **Checar**
(registrar entrada o salida segun el estado de hoy) -> **Historial** y **Ajustes**.
Los administradores gestionan el sistema desde su **Panel** (empleados, organizacion
y reportes).