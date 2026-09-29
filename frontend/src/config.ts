/**
 * Configuracion de la app.
 * La URL de la API se define en el archivo .env del frontend:
 *   EXPO_PUBLIC_API_URL=http://<ip-del-backend>:4000
 */
export type BiometricPreference = 'auto' | 'fingerprint' | 'face';

export interface AppConfig {
  apiUrl: string;
  apiUrlAuto: boolean;
  biometricPreference: BiometricPreference;
  passwordRequired: boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000',
  apiUrlAuto: false,
  biometricPreference: 'auto',
  passwordRequired: true,
};

export const STORAGE_KEYS = {
  config: 'checador.config.v1',
  session: 'checador.session.v1',
} as const;