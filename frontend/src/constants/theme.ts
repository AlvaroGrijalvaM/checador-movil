/**
 * Paleta de la app (claro/oscuro). Incluye colores de marca y de estado de checada.
 */

import '@/global.css';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0E141B',
    background: '#F4F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7EDF6',
    textSecondary: '#5A6474',
    border: '#DDE4EE',
    primary: '#1B6FE0',
    onPrimary: '#FFFFFF',
    success: '#1E9E56',
    onSuccess: '#FFFFFF',
    warning: '#D98A1B',
    onWarning: '#FFFFFF',
    danger: '#D23F3F',
    onDanger: '#FFFFFF',
    info: '#3156C4',
    onInfo: '#FFFFFF',
  },
  dark: {
    text: '#F1F4F9',
    background: '#0C0F14',
    backgroundElement: '#161B23',
    backgroundSelected: '#222A35',
    textSecondary: '#A3ADBC',
    border: '#2A323D',
    primary: '#4C94F5',
    onPrimary: '#06121F',
    success: '#2FBF6B',
    onSuccess: '#05150B',
    warning: '#F0AB3E',
    onWarning: '#1C1102',
    danger: '#E05A5A',
    onDanger: '#1C0505',
    info: '#6C89F2',
    onInfo: '#0A0F22',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/**
 * Espaciado superior de las pantallas: barra de estado/notch del dispositivo
 * (Constants.statusBarHeight en Expo Go / dispositivos) + margen base.
 */
export const TopInset = (Platform.OS === 'web' ? 0 : (Constants.statusBarHeight ?? 0)) + Spacing.six;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;