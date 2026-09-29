import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Departamento, Empleado, Horario, NuevoHorario } from '@/api/contract';
import { createApi } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Field } from '@/components/ui/field';
import { FormModal } from '@/components/ui/form-modal';
import { Pill } from '@/components/ui/pill';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RefreshableScroll } from '@/components/ui/refreshable-scroll';
import { Spacing, TopInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { diaSemanaLabel } from '@/lib/format';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

interface EmpForm {
  mode: 'create' | 'edit';
  emp: Empleado | null;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  id_departamento: number;
  password: string;
  fecha_ingreso: string;
}

interface HorarioView {
  emp: Empleado;
  horarios: Horario[];
  editing: NuevoHorario | null;
  editingId: number | null;
  saving: boolean;
  mensaje: string | null;
}

export default function AdminEmpleadosScreen() {
  const theme = useTheme();
  const { config } = useConfig();
  const { session } = useSession();
  const [empleados, setEmpleados] = useState<Empleado[] | null>(null);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState<EmpForm | null>(null);
  const [pwdEmp, setPwdEmp] = useState<{ emp: Empleado; password: string } | null>(null);
  const [horarioView, setHorarioView] = useState<HorarioView | null>(null);
  const [confirm, setConfirm] = useState<{ titulo: string; mensaje: string; action: () => void } | null>(null);

  const api = useMemo(() => createApi(config, () => session?.token ?? null), [config, session?.token]);

  const cargar = useCallback(async () => {
    try {
      const [emps, deps] = await Promise.all([api.listarEmpleadosAdmin(), api.listarDepartamentos()]);
      setEmpleados(emps);
      setDepartamentos(deps);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los empleados.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  // Busqueda en vivo con debounce (250 ms).
  useEffect(() => {
    const id = setTimeout(() => {
      const q = query.trim();
      if (!q) {
        cargar();
        return;
      }
      api
        .buscarEmpleados(q)
        .then((r) => {
          setEmpleados(r);
          setError(null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Error en la búsqueda.'));
    }, 250);
    return () => clearTimeout(id);
  }, [query, api, cargar]);

  const abrirNuevo = () => {
    setEmpForm({
      mode: 'create',
      emp: null,
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      id_departamento: departamentos.find((d) => d.activo === 1 || d.activo === true)?.id_departamento ?? 1,
      password: '',
      fecha_ingreso: '',
    });
  };

  const abrirEditar = (emp: Empleado) => {
    setEmpForm({
      mode: 'edit',
      emp,
      nombre: emp.nombre,
      apellido_paterno: emp.apellido_paterno,
      apellido_materno: emp.apellido_materno ?? '',
      id_departamento: emp.id_departamento,
      password: '',
      fecha_ingreso: emp.fecha_ingreso ?? '',
    });
  };

  const guardarEmpleado = async () => {
    if (!empForm) return;
    const validos =
      empForm.nombre.trim() &&
      empForm.apellido_paterno.trim() &&
      empForm.id_departamento > 0 &&
      (empForm.mode === 'edit' || empForm.password.trim());
    if (!validos) {
      setError('Completa nombre, apellido paterno, departamento y contraseña (solo al crear).');
      return;
    }
    try {
      if (empForm.mode === 'create') {
        const res = await api.crearEmpleado({
          nombre: empForm.nombre.trim(),
          apellido_paterno: empForm.apellido_paterno.trim(),
          apellido_materno: empForm.apellido_materno.trim() || undefined,
          id_departamento: empForm.id_departamento,
          password: empForm.password,
          fecha_ingreso: empForm.fecha_ingreso || null,
        });
        setSuccessMsg(`Empleado creado · número ${res.numero_empleado ?? 'EMP###'}`);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else if (empForm.emp) {
        await api.actualizarEmpleado(empForm.emp.id_empleado, {
          numero_empleado: empForm.emp.numero_empleado,
          nombre: empForm.nombre.trim(),
          apellido_paterno: empForm.apellido_paterno.trim(),
          apellido_materno: empForm.apellido_materno.trim() || undefined,
          id_departamento: empForm.id_departamento,
          fecha_ingreso: empForm.fecha_ingreso || null,
        });
      }
      setEmpForm(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el empleado.');
    }
  };

  const toggleActivo = async (emp: Empleado) => {
    setEmpForm(null);
    setConfirm(null);
    try {
      await api.activarEmpleado(emp.id_empleado, !(emp.activo === 1 || emp.activo === true));
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar el estado.');
    }
  };

  const guardarPassword = async () => {
    if (!pwdEmp) return;
    if (!pwdEmp.password.trim()) {
      setError('Escribe la nueva contraseña.');
      return;
    }
    try {
      await api.cambiarPasswordEmpleado(pwdEmp.emp.numero_empleado, pwdEmp.password);
      setPwdEmp(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar la contraseña.');
    }
  };

  const abrirHorarios = async (emp: Empleado) => {
    try {
      const horarios = await api.listarHorarios(emp.id_empleado);
      setHorarioView({
        emp,
        horarios,
        editing: null,
        editingId: null,
        saving: false,
        mensaje: null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los horarios.');
    }
  };

  const horarioDraft = (h: NuevoHorario | null): NuevoHorario =>
    h ?? { dia_semana: 1, hora_entrada: '08:00', hora_salida: '17:00', tolerancia_minutos: 10 };

  const actualizarDraft = (patch: Partial<NuevoHorario>) => {
    if (!horarioView) return;
    setHorarioView({ ...horarioView, editing: { ...horarioDraft(horarioView.editing), ...patch } });
  };

  const editarHorario = (h: Horario) => {
    if (!horarioView) return;
    setHorarioView({
      ...horarioView,
      editing: {
        dia_semana: h.dia_semana,
        hora_entrada: h.hora_entrada,
        hora_salida: h.hora_salida,
        tolerancia_minutos: h.tolerancia_minutos,
      },
      editingId: h.id_horario,
      mensaje: null,
    });
  };

  const guardarHorario = async () => {
    if (!horarioView) return;
    const draft = horarioDraft(horarioView.editing);
    setHorarioView({ ...horarioView, saving: true, mensaje: null });
    try {
      if (horarioView.editingId) {
        await api.actualizarHorario(horarioView.editingId, draft);
      } else {
        await api.crearHorario(horarioView.emp.id_empleado, draft);
      }
      const horarios = await api.listarHorarios(horarioView.emp.id_empleado);
      setHorarioView({ ...horarioView, horarios, editing: null, editingId: null, saving: false, mensaje: 'Horario guardado.' });
    } catch (e) {
      setHorarioView({ ...horarioView, saving: false, mensaje: e instanceof Error ? e.message : 'Error al guardar el horario.' });
    }
  };

  const eliminarHorario = async (idHorario: number) => {
    if (!horarioView) return;
    setConfirm(null);
    setHorarioView({ ...horarioView, saving: true });
    try {
      await api.eliminarHorario(idHorario);
      const horarios = await api.listarHorarios(horarioView.emp.id_empleado);
      setHorarioView({ ...horarioView, horarios, saving: false, mensaje: 'Horario eliminado.' });
    } catch (e) {
      setHorarioView({ ...horarioView, saving: false, mensaje: e instanceof Error ? e.message : 'Error al eliminar.' });
    }
  };

  const buscar = async () => {
    if (!query.trim()) {
      await cargar();
      return;
    }
    try {
      const r = await api.buscarEmpleados(query);
      setEmpleados(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error en la búsqueda.');
    }
  };

  return (
    <RefreshableScroll contentContainerStyle={styles.scroll} onRefresh={cargar}>
      <ThemedView style={styles.container}>
        
        <View style={styles.headRow}>
          <ThemedText type="h1" style={styles.title}>
            Empleados
          </ThemedText>
          <PrimaryButton title="Nuevo empleado" onPress={abrirNuevo} />
        </View>

        <View style={styles.buscarRow}>
          <Field
            label="Buscar"
            placeholder="Número, nombre o departamento"
            value={query}
            onChangeText={setQuery}
            containerStyle={styles.buscarField}
            onSubmitEditing={buscar}
          />
          {query.trim() ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button">
              <ThemedText type="smallBold" themeColor="textSecondary">
                ✕
              </ThemedText>
            </Pressable>
          ) : null}
          <PrimaryButton title="Buscar" onPress={buscar} disabled={loading} style={styles.buscarBtn} />
        </View>

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}
        {successMsg ? (
          <ThemedView type="backgroundElement" style={styles.successBanner}>
            <ThemedText type="smallBold" style={{ color: theme.success }}>
              ✓ {successMsg}
            </ThemedText>
          </ThemedView>
        ) : null}

        {empleados === null ? (
          <ThemedText type="small" themeColor="textSecondary">
            Cargando…
          </ThemedText>
        ) : empleados.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin empleados.
          </ThemedText>
        ) : (
          <View style={styles.list}>
            {empleados.map((emp) => {
              const activo = emp.activo === 1 || emp.activo === true;
              return (
                <ThemedView key={emp.id_empleado} type="backgroundElement" style={styles.row}>
                  <View style={styles.rowHead}>
                    <View style={[styles.initials, { backgroundColor: activo ? theme.primary : theme.backgroundSelected }]}>
                      <ThemedText type="smallBold" style={{ color: activo ? theme.onPrimary : theme.textSecondary, fontSize: 12 }}>
                        {emp.nombre_completo.split(' ').filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase()}
                      </ThemedText>
                    </View>
                    <View style={styles.rowInfo}>
                      <ThemedText type="smallBold">{emp.nombre_completo}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {emp.numero_empleado} · {emp.nombre_departamento}
                      </ThemedText>
                    </View>
                    <View style={[styles.activoPill, { backgroundColor: activo ? theme.success : theme.backgroundSelected }]}>
                      <ThemedText type="small" style={{ color: activo ? theme.onSuccess : theme.textSecondary }}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <PrimaryButton variant="ghost" title="Horarios" onPress={() => abrirHorarios(emp)} style={styles.smallBtn} />
                    <PrimaryButton variant="ghost" title="Editar" onPress={() => abrirEditar(emp)} style={styles.smallBtn} />
                    <PrimaryButton variant="ghost" title="Contraseña" onPress={() => setPwdEmp({ emp, password: '' })} style={styles.smallBtn} />
                    <PrimaryButton
                      variant={activo ? 'warning' : 'success'}
                      title={activo ? 'Desactivar' : 'Activar'}
                      onPress={() => setConfirm({
                        titulo: activo ? 'Desactivar empleado' : 'Activar empleado',
                        mensaje: `¿Confirmas ${activo ? 'desactivar' : 'activar'} a ${emp.nombre_completo} (${emp.numero_empleado})?`,
                        action: () => toggleActivo(emp),
                      })}
                      style={styles.smallBtn}
                    />
                  </View>
                </ThemedView>
              );
            })}
          </View>
        )}
      </ThemedView>

      <FormModal
        visible={empForm !== null}
        title={empForm?.mode === 'edit' ? `Editar ${empForm.emp?.numero_empleado ?? ''}` : 'Nuevo empleado'}
        submitLabel={empForm?.mode === 'edit' ? 'Guardar cambios' : 'Crear empleado'}
        onCancel={() => setEmpForm(null)}
        onSubmit={guardarEmpleado}>
        {empForm?.mode === 'edit' && empForm.emp ? (
          <ThemedText type="small" themeColor="textSecondary">
            Número: {empForm.emp.numero_empleado}
          </ThemedText>
        ) : null}
        <Field label="Nombre" value={empForm?.nombre ?? ''} onChangeText={(t) => empForm && setEmpForm({ ...empForm, nombre: t })} />
        <Field label="Apellido paterno" value={empForm?.apellido_paterno ?? ''} onChangeText={(t) => empForm && setEmpForm({ ...empForm, apellido_paterno: t })} />
        <Field label="Apellido materno (opcional)" value={empForm?.apellido_materno ?? ''} onChangeText={(t) => empForm && setEmpForm({ ...empForm, apellido_materno: t })} />
        <View style={styles.deptRow}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Departamento
          </ThemedText>
          <View style={styles.pillRow}>
            {departamentos.map((d) => (
              <Pill
                key={d.id_departamento}
                label={d.nombre_departamento}
                selected={empForm?.id_departamento === d.id_departamento}
                onPress={() => empForm && setEmpForm({ ...empForm, id_departamento: d.id_departamento })}
              />
            ))}
          </View>
        </View>
        {empForm?.mode === 'create' ? (
          <Field label="Contraseña inicial" placeholder="Mínimo 6 caracteres" value={empForm?.password ?? ''} onChangeText={(t) => empForm && setEmpForm({ ...empForm, password: t })} secureTextEntry />
        ) : null}
        <Field label="Fecha de ingreso (AAAA-MM-DD, opcional)" value={empForm?.fecha_ingreso ?? ''} onChangeText={(t) => empForm && setEmpForm({ ...empForm, fecha_ingreso: t })} placeholder="AAAA-MM-DD" />
      </FormModal>

      <FormModal
        visible={pwdEmp !== null}
        title={pwdEmp ? `Contraseña de ${pwdEmp.emp.numero_empleado}` : ''}
        submitLabel="Guardar contraseña"
        onCancel={() => setPwdEmp(null)}
        onSubmit={guardarPassword}>
        <Field label="Nueva contraseña" placeholder="Mínimo 6 caracteres" value={pwdEmp?.password ?? ''} onChangeText={(t) => pwdEmp && setPwdEmp({ ...pwdEmp, password: t })} secureTextEntry />
      </FormModal>

      <FormModal
        visible={horarioView !== null}
        title={horarioView ? `Horarios de ${horarioView.emp.numero_empleado}` : ''}
        submitLabel={horarioView?.editingId ? 'Guardar horario' : horarioView?.editing ? 'Agregar horario' : 'Cerrar'}
        onCancel={() => setHorarioView(null)}
        onSubmit={horarioView?.editing || horarioView?.editingId ? guardarHorario : () => setHorarioView(null)}
        loading={horarioView?.saving ?? false}>
        {horarioView?.mensaje ? (
          <ThemedText type="small" themeColor="textSecondary">
            {horarioView.mensaje}
          </ThemedText>
        ) : null}
        {horarioView && (horarioView.editing || horarioView.editingId) ? (
          <View style={[styles.boxMini, { backgroundColor: theme.backgroundSelected }]}>
            <View style={styles.pillRow}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <Pill
                  key={d}
                  label={d.toString()}
                  selected={horarioDraft(horarioView.editing).dia_semana === d}
                  onPress={() => actualizarDraft({ dia_semana: d })}
                />
              ))}
            </View>
            <Field label="Entrada (HH:MM)" value={horarioDraft(horarioView.editing).hora_entrada} onChangeText={(t) => actualizarDraft({ hora_entrada: t })} />
            <Field label="Salida (HH:MM)" value={horarioDraft(horarioView.editing).hora_salida} onChangeText={(t) => actualizarDraft({ hora_salida: t })} />
            <Field label="Tolerancia (min)" value={String(horarioDraft(horarioView.editing).tolerancia_minutos)} onChangeText={(t) => actualizarDraft({ tolerancia_minutos: Number(t.replace(/[^0-9]/g, '')) || 0 })} keyboardType="numeric" />
          </View>
        ) : (
          <PrimaryButton variant="ghost" title="Agregar horario" onPress={() => actualizarDraft({ dia_semana: 1, hora_entrada: '08:00', hora_salida: '17:00', tolerancia_minutos: 10 })} />
        )}
        <View style={styles.list}>
          {(horarioView?.horarios ?? []).map((h) => (
            <ThemedView key={h.id_horario} type="backgroundSelected" style={styles.horarioRow}>
              <View style={styles.rowInfo}>
                <ThemedText type="smallBold">{diaSemanaLabel(h.dia_semana)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {h.hora_entrada} → {h.hora_salida} · tolerancia {h.tolerancia_minutos} min
                </ThemedText>
              </View>
              <Pressable onPress={() => editarHorario(h)} accessibilityRole="button" hitSlop={8}>
                <ThemedText type="link">Editar</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setConfirm({
                  titulo: 'Eliminar horario',
                  mensaje: `¿Eliminar el horario de ${diaSemanaLabel(h.dia_semana)}?`,
                  action: () => eliminarHorario(h.id_horario),
                })}
                accessibilityRole="button"
                hitSlop={8}>
                <ThemedText type="link" style={{ color: theme.danger }}>
                  Eliminar
                </ThemedText>
              </Pressable>
            </ThemedView>
          ))}
        </View>
      </FormModal>

      <ConfirmModal
        visible={confirm !== null}
        title={confirm?.titulo ?? ''}
        message={confirm?.mensaje ?? ''}
        confirmLabel="Confirmar"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
      />
    </RefreshableScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: TopInset, paddingBottom: Spacing.six + 40, alignItems: 'center' },
  container: { width: '100%', maxWidth: 600, gap: Spacing.three, position: 'relative' },
  title: { marginTop: Spacing.half },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  buscarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  buscarField: { flex: 1 },
  buscarBtn: { minHeight: 44 },
  successBanner: { borderRadius: Spacing.three, padding: Spacing.two },
  list: { gap: Spacing.two },
  row: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  initials: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: Spacing.half },
  activoPill: { paddingVertical: Spacing.half, paddingHorizontal: Spacing.two, borderRadius: Spacing.four },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  smallBtn: { minHeight: 44, paddingVertical: Spacing.two, paddingHorizontal: Spacing.two, borderRadius: Spacing.two },
  deptRow: { gap: Spacing.two },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  boxMini: { gap: Spacing.two, borderRadius: Spacing.three, padding: Spacing.two },
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: Spacing.three, padding: Spacing.two },
});