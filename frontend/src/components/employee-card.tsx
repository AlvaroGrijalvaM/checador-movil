import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { Empleado } from '@/api/contract';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

function initials(e: Empleado): string {
  const parts = e.nombre_completo.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function EmployeeCard({ empleado }: { empleado: Empleado }) {
  const theme = useTheme();
  const photo = empleado.foto_url;
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: theme.onPrimary, fontSize: 18 }}>
            {initials(empleado)}
          </ThemedText>
        </View>
      )}
      <View style={styles.info}>
        <ThemedText type="smallBold" style={styles.name}>
          {empleado.nombre_completo}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {empleado.numero_empleado} · {empleado.nombre_departamento}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.four,
    padding: Spacing.three,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  name: {
    fontSize: 17,
  },
});