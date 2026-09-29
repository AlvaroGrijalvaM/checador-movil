/** Tipos compartidos de la capa de biometria. */

export type BiometricMethod = 'fingerprint' | 'face';

export interface BiometricCapabilities {
  hardwareSupported: boolean;
  fingerprintAvailable: boolean;
  faceAvailable: boolean;
}

export type BiometricError =
  | 'no_hardware'
  | 'not_enrolled'
  | 'user_cancel'
  | 'lockout'
  | 'authentication_failed'
  | 'unknown';

export interface BiometricVerification {
  success: boolean;
  method: BiometricMethod;
  /** true si la verificacion la resolvio el sistema operativo del dispositivo. */
  hardware: boolean;
  /** selfie para previsualizacion (data URI) cuando el metodo fue rostro. */
  capturedUri?: string | null;
  /** selfie en base64 puro para subirla al servidor. */
  capturedBase64?: string | null;
  /** nombre sugerido del archivo de la foto. */
  filename?: string | null;
  error?: BiometricError | null;
  errorDetail?: string | null;
}