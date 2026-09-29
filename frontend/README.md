# checador-movil (frontend)

App movil Expo/React Native (SDK 57) del sistema **Checador Smart Display / TV**.
Identifica al empleado por su numero, valida su identidad con biometria del
**telefono** (huella/rostro vía `expo-local-authentication`) y registra
entrada/salida contra la nube (backend + MySQL `checador_db`).

## Requisitos

- Node.js >= 22 (ver AGENTS.md)
- Expo Go (Android/iOS) o `npx expo start --web`

## Instalacion y ejecucion

    npm install
    npx expo start

Para abrir en el telefono escanea el QR con **Expo Go** (misma red Wi-Fi).
Para web, presiona `w`.

## Servidor (URL de la API)

La URL del backend se define en el archivo **`.env`** del frontend (copiando
`.env.example`):

    EXPO_PUBLIC_API_URL=http://192.168.1.100:4000

- En el telefono (Expo Go) usa la **IP LAN** de tu computadora, NO `localhost`.
- En web / emulador puede quedar `http://localhost:4000`.
- El backend usa MySQL local en `localhost:3306` (ver `backend/.env`).

## Biometria

La verificacion la realiza el sistema operativo del dispositivo (biometria en
Android; FaceID/TouchID en iOS). Si el dispositivo no tiene biometria registrada
(o en web/emulador), la app usa un **modo simulado** claramente indicado.

> Nota: FaceID requiere un development build (Expo Go no lo soporta en iOS).

## Estructura

    src/app/
       _layout.tsx            Rutas protegidas (Stack.Protected) + providers
       sign-in.tsx            Identifica empleado y verifica biometria
       (app)/_layout.tsx      Pestanas nativas: Checar, Historial, Ajustes
       (app)/_layout.web.tsx  Pestanas web (expo-router/ui)
       (app)/index.tsx        Registrar entrada/salida segun estado del dia
       (app)/history.tsx      Historial personal
       (app)/settings.tsx     Preferencias biometricas y sesion
    src/api/                  contrato + cliente HTTP
    src/biometrics/           expo-local-authentication + tipos
    src/state/                sesion y configuracion (expo-secure-store)
    src/components/           UI reutilizable y verifier biometrico
## Apartado de administracion

Cuando inicia sesion un **administrador** (pestana *Administrador* en `sign-in`),
la app muestra un conjunto de pestanas exclusivo con las funciones de gestion
que definen los stored procedures de `checador_db`:

- **Empleados** — listar/buscar, crear y editar empleados, activar/desactivar
  (soft delete), cambiar contrasena y administrar **horarios** por empleado
  (dia, entrada, salida y tolerancia).
- **Organizacion** — CRUD de **departamentos** y de **administradores**
  (crear, editar, cambiar contrasena, activar/desactivar).
- **Reportes** — por fecha (tabla de checadas) y resumen
  con totales, a tiempo, retardos y retardos de hoy.
- **Ajustes** — compartido con el rol empleado.

Credenciales iniciales tras `npm run seed:hash`:
`admin / 123123` para el administrador y `EMP001 / 123123` para los empleados
(los inserts de `checador_db`).