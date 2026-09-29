import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { ChecadaRegistro } from '@/api/contract';
import { createApi } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Pill } from '@/components/ui/pill';
import { RefreshableScroll } from '@/components/ui/refreshable-scroll';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing, TopInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDuration, formatTime, toDate } from '@/lib/format';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

export default function HistoryScreen() {
  const theme = useTheme();
  const { config } = useConfig();
  const { session } = useSession();
  const [rows, setRows] = useState<ChecadaRegistro[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroMes, setFiltroMes] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<number | null>(null);
  const api = useMemo(() => createApi(config, () => session?.token ?? null), [config, session?.token]);

  const cargar = useCallback(async () => {
    const numero = session?.empleado?.numero_empleado;
    if (!numero) return;
    try {
      const r = await api.historial(numero);
      setRows(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar el historial.');
    }
  }, [api, session]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const meses = useMemo<string[]>(() => {
    if (!rows) return [];
    return Array.from(new Set(rows.map((r) => r.fecha_entrada.slice(0, 7)))).sort().reverse();
  }, [rows]);

  const visibles = rows?.filter((r) => !filtroMes || r.fecha_entrada.startsWith(filtroMes)) ?? [];

  return (
    <RefreshableScroll contentContainerStyle={styles.scroll} onRefresh={cargar}>
      <ThemedView style={styles.container}>
        
        <ThemedText type="h1" style={styles.title}>
          Historial
        </ThemedText>

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}

        {rows === null ? (
          <ActivityIndicator color={theme.primary} />
        ) : rows.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            Sin checadas registradas todavía.
          </ThemedText>
        ) : (
          <>
            <View style={styles.pillRow}>
              <Pill label="Todo" selected={filtroMes === null} onPress={() => setFiltroMes(null)} />
              {meses.slice(0, 6).map((m) => (
                <Pill key={m} label={m} selected={filtroMes === m} onPress={() => setFiltroMes(m)} />
              ))}
            </View>
            <View style={styles.list}>
              {visibles.map((row) => {
                const entrada = toDate(row.fecha_entrada);
                const salida = toDate(row.fecha_salida);
                const abierta = expandida === row.id_checada;
                return (
                  <Pressable
                    key={row.id_checada}
                    accessibilityLabel="Detalle de checada"
                    onPress={() => setExpandida(abierta ? null : row.id_checada)}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedView type="backgroundElement" style={styles.row}>
                      <View style={styles.rowHeader}>
                        <ThemedText type="smallBold">{entrada ? formatDate(row.fecha_entrada) : '—'}</ThemedText>
                        <StatusBadge state={row.estado} />
                      </View>
                      <View style={styles.rowDetail}>
                        <ThemedText type="small" themeColor="textSecondary">
                          Entrada:{' '}
                          <ThemedText type="small">{entrada ? formatTime(entrada) : '—'}</ThemedText>
                          {'   '}Salida:{' '}
                          <ThemedText type="small">{salida ? formatTime(salida) : 'En curso'}</ThemedText>
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          Duración: {formatDuration(row.fecha_entrada, row.fecha_salida)}
                        </ThemedText>
                      </View>
                      {abierta ? (
                        <View style={styles.rowDetail}>
                          <ThemedText type="small" themeColor="textSecondary">
                            Foto entrada:{' '}{row.foto_entrada_url ?? '—'}{'\n'}Foto salida:{' '}{row.foto_salida_url ?? '—'}
                          </ThemedText>
                          {row.observaciones ? (
                            <ThemedText type="small" themeColor="textSecondary">
                              Observaciones: {row.observaciones}
                            </ThemedText>
                          ) : null}
                        </View>
                      ) : null}
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ThemedView>
    </RefreshableScroll>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: TopInset,
    paddingBottom: Spacing.six + 40,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 560,
    gap: Spacing.three,
    position: 'relative',
  },
  title: {
    marginTop: Spacing.half,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  list: {
    gap: Spacing.three,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDetail: {
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.85,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});