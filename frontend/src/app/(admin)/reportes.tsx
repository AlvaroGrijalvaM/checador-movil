import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ReporteRow } from '@/api/contract';
import { createApi } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RefreshableScroll } from '@/components/ui/refreshable-scroll';
import { StatusBadge } from '@/components/ui/status-badge';
import { Spacing, TopInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatTime, toDate } from '@/lib/format';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

function fechaInput(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminReportesScreen() {
  const theme = useTheme();
  const { config } = useConfig();
  const { session } = useSession();
  const [fecha, setFecha] = useState(fechaInput);
  const [rows, setRows] = useState<ReporteRow[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useMemo(() => createApi(config, () => session?.token ?? null), [config, session?.token]);



  const consultar = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
      setError('Fecha inválida (use AAAA-MM-DD).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await api.reporteFecha(fecha.trim());
      setRows(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al consultar el reporte.');
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  const consultarHoy = async () => {
    const f = fechaInput();
    setFecha(f);
    setLoading(true);
    setError(null);
    try {
      const r = await api.reporteFecha(f);
      setRows(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al consultar el reporte.');
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  const consultarAyer = async () => {
    setFecha(fechaInput(-1));
    // el reporte usa el estado de `fecha`, por eso se consulta con la nueva fecha
    setLoading(true);
    setError(null);
    const f = fechaInput(-1);
    try {
      const r = await api.reporteFecha(f);
      setRows(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al consultar el reporte.');
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  const contar = (estado: 'A_TIEMPO' | 'RETARDO') => (rows ?? []).filter((r) => r.estado === estado).length;

  return (
    <RefreshableScroll contentContainerStyle={styles.scroll} onRefresh={consultar}>
      <ThemedView style={styles.container}>
        
        <ThemedText type="h1" style={styles.title}>
          Reportes
        </ThemedText>

        <View style={styles.quick}>
          <Pill label="Hoy" selected={fecha === fechaInput()} onPress={consultarHoy} />
          <Pill label="Ayer" selected={fecha === fechaInput(-1)} onPress={consultarAyer} />
          <Pill label="Consultar" selected={false} onPress={consultar} />
        </View>

        <View style={styles.filter}>
          <Field label="Fecha (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} autoCapitalize="none" autoCorrect={false} containerStyle={styles.filterField} />
          <PrimaryButton title="Buscar" onPress={consultar} loading={loading} disabled={loading} style={styles.filterBtn} />
        </View>

        <View style={styles.stats}>
          <ThemedView type="backgroundElement" style={styles.stat}>
            <ThemedText type="small" themeColor="textSecondary">Checadas</ThemedText>
            <ThemedText type="subtitle" style={styles.statValue}>{rows?.length ?? '—'}</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.stat}>
            <ThemedText type="small" themeColor="textSecondary">A tiempo</ThemedText>
            <ThemedText type="subtitle" style={[styles.statValue, { color: theme.success }]}>{rows ? contar('A_TIEMPO') : '—'}</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.stat}>
            <ThemedText type="small" themeColor="textSecondary">Retardos</ThemedText>
            <ThemedText type="subtitle" style={[styles.statValue, { color: theme.danger }]}>{rows ? contar('RETARDO') : '—'}</ThemedText>
          </ThemedView>

        </View>

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}

        {rows === null ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Elige una fecha y toca Buscar para generar el reporte.
          </ThemedText>
        ) : rows.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin checadas para {fecha.trim()}.
          </ThemedText>
        ) : (
          <View style={styles.list}>
            {rows.map((r) => {
              const entrada = toDate(r.fecha_entrada);
              const salida = toDate(r.fecha_salida);
              return (
                <ThemedView key={r.id_checada} type="backgroundElement" style={styles.row}>
                  <View style={styles.rowHead}>
                    <View style={styles.rowInfo}>
                      <ThemedText type="smallBold">{r.nombre_completo}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {r.numero_empleado} · {r.nombre_departamento}
                      </ThemedText>
                    </View>
                    <StatusBadge state={r.estado} />
                  </View>
                  <View style={styles.rowDetail}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {fecha.trim()}:{' '}
                      <ThemedText type="small">{entrada ? formatTime(entrada) : '—'}</ThemedText>
                      {' → '}
                      <ThemedText type="small">{salida ? formatTime(salida) : 'En curso'}</ThemedText>
                      {' · duración '}
                      <ThemedText type="small">{formatDuration(r.fecha_entrada, r.fecha_salida)}</ThemedText>
                    </ThemedText>
                  </View>
                </ThemedView>
              );
            })}
          </View>
        )}
      </ThemedView>
    </RefreshableScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: TopInset, paddingBottom: Spacing.six + 40, alignItems: 'center' },
  container: { width: '100%', maxWidth: 600, gap: Spacing.three, position: 'relative' },
  title: { marginTop: Spacing.half },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  filter: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  filterField: { flex: 1 },
  filterBtn: { minHeight: 44 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { flex: 1, minWidth: 120, borderRadius: Spacing.three, padding: Spacing.two, gap: Spacing.half, alignItems: 'center' },
  statValue: { fontSize: 24, lineHeight: 30 },
  list: { gap: Spacing.two },
  row: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  rowInfo: { flex: 1, gap: Spacing.half },
  rowDetail: { gap: Spacing.half },
  hint: { textAlign: 'center' },
});