/**
 * Capa de persistencia: expo-secure-store en dispositivos nativos y
 * almacenamiento en memoria (fallback) cuando no hay modulo nativo (web, emulador).
 */
import { Platform } from 'react-native';

type SecureStoreModule = typeof import('expo-secure-store');

let secureStore: SecureStoreModule | null | undefined;
let available: boolean | null = null;

async function loadSecureStore(): Promise<SecureStoreModule | null> {
  if (secureStore !== undefined) return secureStore;
  if (Platform.OS === 'web') {
    secureStore = null;
    return null;
  }
  try {
    secureStore = await import('expo-secure-store');
  } catch {
    secureStore = null;
  }
  return secureStore;
}

async function isAvailable(): Promise<boolean> {
  if (available !== null) return available;
  const mod = await loadSecureStore();
  if (!mod) {
    available = false;
    return false;
  }
  try {
    available = await mod.isAvailableAsync();
  } catch {
    available = false;
  }
  return available;
}

const memory = new Map<string, string>();

export async function getItem(key: string): Promise<string | null> {
  if (await isAvailable()) {
    const mod = await loadSecureStore();
    if (mod) {
      try {
        return await mod.getItemAsync(key);
      } catch {
        return memory.get(key) ?? null;
      }
    }
  }
  return memory.get(key) ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  memory.set(key, value);
  if (await isAvailable()) {
    const mod = await loadSecureStore();
    if (mod) {
      try {
        await mod.setItemAsync(key, value);
        return;
      } catch {
        // continua con el fallback en memoria
      }
    }
  }
}

export async function removeItem(key: string): Promise<void> {
  memory.delete(key);
  if (await isAvailable()) {
    const mod = await loadSecureStore();
    if (mod) {
      try {
        await mod.deleteItemAsync(key);
      } catch {
        // ignorar
      }
    }
  }
}