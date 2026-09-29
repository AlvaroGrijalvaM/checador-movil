import { StyleSheet, View } from 'react-native';

import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';

export type BadgeState =
  | 'SIN_CHECADA'
  | 'ENTRADA_ABIERTA'
  | 'JORNADA_COMPLETA'
  | 'A_TIEMPO'
  | 'RETARDO';

const MAP: Record<
  BadgeState,
  { label: string; bg: ThemeColor; fg: ThemeColor }
> = {
  A_TIEMPO: { label: 'A tiempo', bg: 'success', fg: 'onSuccess' },
  RETARDO: { label: 'Retardo', bg: 'danger', fg: 'onDanger' },
  ENTRADA_ABIERTA: { label: 'En jornada', bg: 'warning', fg: 'onWarning' },
  JORNADA_COMPLETA: { label: 'Jornada completa', bg: 'info', fg: 'onInfo' },
  SIN_CHECADA: { label: 'Sin checar', bg: 'backgroundSelected', fg: 'text' },
};

export function StatusBadge({ state }: { state: BadgeState }) {
  const theme = useTheme();
  const cfg = MAP[state] ?? MAP.SIN_CHECADA;
  return (
    <View style={[styles.badge, { backgroundColor: theme[cfg.bg] }]}>
      <ThemedText type="smallBold" style={{ color: theme[cfg.fg] }}>
        {cfg.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
});