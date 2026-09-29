import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '../themed-text';

export function LoadingOverlay({ label = 'Cargando…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
});