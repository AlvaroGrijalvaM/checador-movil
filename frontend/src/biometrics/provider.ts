/**
 * Proveedor de biometria del dispositivo.
 *
 * En Android usa el Biometric Prompt; en iOS TouchID/FaceID. Cuando el
 * dispositivo no tiene biometria registrada (o estamos en web/emulador),
 * la UI cae al modo simulado (ver components/biometric-verifier.tsx).
 */
import { Platform } from 'react-native';

import type { BiometricCapabilities, BiometricMethod, BiometricVerification } from './types';

type LocalAuthModule = typeof import('expo-local-authentication');

let la: LocalAuthModule | null | undefined;

async function loadLA(): Promise<LocalAuthModule | null> {
  if (la !== undefined) return la;
  if (Platform.OS === 'web') {
    la = null;
    return null;
  }
  try {
    la = await import('expo-local-authentication');
  } catch {
    la = null;
  }
  return la;
}

/** Consulta la biometria disponible en el dispositivo. */
export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  const mod = await loadLA();
  if (!mod) return { hardwareSupported: false, fingerprintAvailable: false, faceAvailable: false };
  try {
    const hardware = await mod.hasHardwareAsync();
    const enrolled = await mod.isEnrolledAsync();
    const types = await mod.supportedAuthenticationTypesAsync();
    const supported = hardware && enrolled;
    return {
      hardwareSupported: supported,
      fingerprintAvailable: supported && types.includes(mod.AuthenticationType.FINGERPRINT),
      faceAvailable: supported && types.includes(mod.AuthenticationType.FACIAL_RECOGNITION),
    };
  } catch {
    return { hardwareSupported: false, fingerprintAvailable: false, faceAvailable: false };
  }
}

/** Ejecuta la verificacion real con el sistema operativo (huella/rostro). */
export async function verifyWithSystem(
  method: BiometricMethod,
  context: string,
  subtitle?: string,
): Promise<BiometricVerification> {
  const mod = await loadLA();
  if (!mod) return { success: false, method, hardware: false, error: 'no_hardware' };
  try {
    const result = await mod.authenticateAsync({
      promptMessage: context,
      promptSubtitle: subtitle ?? 'Se validara tu identidad con la biometria del dispositivo',
      requireConfirmation: true,
    });
    if (result.success) {
      return { success: true, method, hardware: true };
    }
    const err = result.error ?? 'unknown';
    if (err === 'user_cancel' || err === 'system_cancel' || err === 'app_cancel') {
      return { success: false, method, hardware: true, error: 'user_cancel', errorDetail: err };
    }
    if (err === 'not_enrolled') {
      return { success: false, method, hardware: true, error: 'not_enrolled', errorDetail: err };
    }
    if (err === 'lockout') {
      return { success: false, method, hardware: true, error: 'lockout', errorDetail: err };
    }
    if (err === 'authentication_failed') {
      return { success: false, method, hardware: true, error: 'authentication_failed', errorDetail: err };
    }
    return { success: false, method, hardware: true, error: 'unknown', errorDetail: err };
  } catch (e) {
    return { success: false, method, hardware: true, error: 'unknown', errorDetail: e instanceof Error ? e.message : String(e) };
  }
}