import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, TopInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/state/session';

const TARGETS = [
  { href: '/empleados', titulo: 'Empleados', descripcion: 'Gestionar empleados y sus horarios' },
  { href: '/organizacion', titulo: 'Organización', descripcion: 'Departamentos y administradores' },
  { href: '/reportes', titulo: 'Reportes', descripcion: 'Checadas por fecha y resumen' },
  { href: '/settings', titulo: 'Ajustes', descripcion: 'Preferencias y sesión' },
] as const;

export default function AdminHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const admin = session?.admin;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        <ThemedText type="small" themeColor="textSecondary">
          Panel de administración
        </ThemedText>
        <ThemedText type="h1" style={styles.title}>
          {admin?.nombre ?? 'Administración'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Selecciona una sección para gestionar el sistema.
        </ThemedText>

        <View style={styles.grid}>
          {TARGETS.map((t) => (
            <Pressable
              key={t.href}
              accessibilityRole="button"
              onPress={() => router.push(t.href)}
              style={({ pressed, hovered }) => [
                styles.card,
                { backgroundColor: pressed || hovered ? theme.backgroundSelected : theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="h2" style={styles.cardTitle}>
                {t.titulo}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t.descripcion}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: TopInset,
    paddingBottom: Spacing.six + 40,
  },
  container: {
    width: '100%',
    maxWidth: 640,
    gap: Spacing.two,
  },
  title: { marginTop: Spacing.half },
  subtitle: { marginBottom: Spacing.three },
  grid: { gap: Spacing.three },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  cardTitle: { marginBottom: Spacing.half },
  pressed: { opacity: 0.85 },
});