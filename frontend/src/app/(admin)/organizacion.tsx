import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { AdminInfo, Departamento } from '@/api/contract';
import { createApi } from '@/api/client';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Field } from '@/components/ui/field';
import { FormModal } from '@/components/ui/form-modal';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RefreshableScroll } from '@/components/ui/refreshable-scroll';
import { Spacing, TopInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConfig } from '@/state/config';
import { useSession } from '@/state/session';

interface DeptForm {
  editing: boolean;
  id: number | null;
  nombre: string;
  descripcion: string;
}

interface AdminForm {
  editing: boolean;
  id: number | null;
  usuario: string;
  nombre: string;
  password: string;
}

export default function AdminOrganizacionScreen() {
  const theme = useTheme();
  const { config } = useConfig();
  const { session } = useSession();
  const [departamentos, setDepartamentos] = useState<Departamento[] | null>(null);
  const [admins, setAdmins] = useState<AdminInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState<DeptForm | null>(null);
  const [adminForm, setAdminForm] = useState<AdminForm | null>(null);
  const [pwdAdmin, setPwdAdmin] = useState<{ id: number; usuario: string; password: string } | null>(null);
  const [confirm, setConfirm] = useState<{ titulo: string; mensaje: string; action: () => void } | null>(null);

  const api = useMemo(() => createApi(config, () => session?.token ?? null), [config, session?.token]);

  const cargar = useCallback(async () => {
    try {
      const [deps, adms] = await Promise.all([api.listarDepartamentos(), api.listarAdmins()]);
      setDepartamentos(deps);
      setAdmins(adms);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la organización.');
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const guardarDepartamento = async () => {
    if (!deptForm) return;
    if (!deptForm.nombre.trim()) {
      setError('El nombre del departamento es obligatorio.');
      return;
    }
    try {
      if (deptForm.editing && deptForm.id) {
        await api.actualizarDepartamento(deptForm.id, deptForm.nombre.trim(), deptForm.descripcion.trim());
      } else {
        await api.crearDepartamento(deptForm.nombre.trim(), deptForm.descripcion.trim());
      }
      setDeptForm(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el departamento.');
    }
  };

  const toggleDepartamento = async (d: Departamento) => {
    setConfirm(null);
    try {
      await api.activarDepartamento(d.id_departamento, !(d.activo === 1 || d.activo === true));
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar el estado.');
    }
  };

  const guardarAdmin = async () => {
    if (!adminForm) return;
    if (!adminForm.usuario.trim() || !adminForm.nombre.trim() || (!adminForm.editing && !adminForm.password.trim())) {
      setError('Usuario, nombre y contraseña son obligatorios.');
      return;
    }
    try {
      if (adminForm.editing && adminForm.id) {
        await api.actualizarAdmin(adminForm.id, { usuario: adminForm.usuario.trim(), nombre: adminForm.nombre.trim() });
      } else {
        await api.crearAdmin({ usuario: adminForm.usuario.trim(), password: adminForm.password, nombre: adminForm.nombre.trim() });
      }
      setAdminForm(null);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el administrador.');
    }
  };

  const toggleAdmin = async (a: AdminInfo) => {
    setConfirm(null);
    try {
      await api.activarAdmin(a.id_admin, !(a.activo === 1 || a.activo === true));
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar el estado.');
    }
  };

  const guardarPwdAdmin = async () => {
    if (!pwdAdmin) return;
    if (!pwdAdmin.password.trim()) {
      setError('Escribe la nueva contraseña.');
      return;
    }
    try {
      await api.cambiarPasswordAdmin(pwdAdmin.id, pwdAdmin.password);
      setPwdAdmin(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar la contraseña.');
    }
  };

  return (
    <RefreshableScroll contentContainerStyle={styles.scroll} onRefresh={cargar}>
      <ThemedView style={styles.container}>
        
        <ThemedText type="h1" style={styles.title}>
          Organización
        </ThemedText>

        {error ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        ) : null}

        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Departamentos
            </ThemedText>
            <PrimaryButton title="Nuevo" onPress={() => setDeptForm({ editing: false, id: null, nombre: '', descripcion: '' })} style={styles.smallBtn} />
          </View>
          {departamentos === null ? (
            <ThemedText type="small" themeColor="textSecondary">
              Cargando…
            </ThemedText>
          ) : (
            <View style={styles.list}>
              {departamentos.map((d) => {
                const activo = d.activo === 1 || d.activo === true;
                return (
                  <ThemedView key={d.id_departamento} type="backgroundSelected" style={styles.item}>
                    <View style={styles.itemHead}>
                      <ThemedText type="smallBold" style={styles.itemTitle}>
                        {d.nombre_departamento}
                      </ThemedText>
                      <View style={[styles.activoPill, { backgroundColor: activo ? theme.success : theme.backgroundSelected }]}>
                        <ThemedText type="smallBold" style={{ color: activo ? theme.onSuccess : theme.textSecondary }}>
                          {activo ? 'Activo' : 'Inactivo'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {d.descripcion || 'Sin descripción'}
                    </ThemedText>
                    <View style={styles.itemActions}>
                      <PrimaryButton
                        variant="ghost"
                        title="Editar"
                        onPress={() => setDeptForm({ editing: true, id: d.id_departamento, nombre: d.nombre_departamento, descripcion: d.descripcion ?? '' })}
                        style={styles.tinyBtn}
                      />
                      <PrimaryButton
                        variant={activo ? 'warning' : 'success'}
                        title={activo ? 'Desactivar' : 'Activar'}
                        onPress={() =>
                          setConfirm({
                            titulo: activo ? 'Desactivar departamento' : 'Activar departamento',
                            mensaje: `¿Confirmas ${activo ? 'desactivar' : 'activar'} el departamento ${d.nombre_departamento}?`,
                            action: () => toggleDepartamento(d),
                          })
                        }
                        style={styles.tinyBtn}
                      />
                    </View>
                  </ThemedView>
                );
              })}
            </View>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Administradores
            </ThemedText>
            <PrimaryButton title="Nuevo" onPress={() => setAdminForm({ editing: false, id: null, usuario: '', nombre: '', password: '' })} style={styles.smallBtn} />
          </View>
          {admins === null ? (
            <ThemedText type="small" themeColor="textSecondary">
              Cargando…
            </ThemedText>
          ) : (
            <View style={styles.list}>
              {admins.map((a) => {
                const activo = a.activo === 1 || a.activo === true;
                return (
                  <ThemedView key={a.id_admin} type="backgroundSelected" style={styles.item}>
                    <View style={styles.itemHead}>
                      <ThemedText type="smallBold" style={styles.itemTitle}>
                        {a.nombre}
                      </ThemedText>
                      <View style={[styles.activoPill, { backgroundColor: activo ? theme.success : theme.backgroundSelected }]}>
                        <ThemedText type="smallBold" style={{ color: activo ? theme.onSuccess : theme.textSecondary }}>
                          {activo ? 'Activo' : 'Inactivo'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      @{a.usuario}
                    </ThemedText>
                    <View style={styles.itemActions}>
                      <PrimaryButton
                        variant="ghost"
                        title="Editar"
                        onPress={() => setAdminForm({ editing: true, id: a.id_admin, usuario: a.usuario, nombre: a.nombre, password: '' })}
                        style={styles.tinyBtn}
                      />
                      <PrimaryButton
                        variant="ghost"
                        title="Contraseña"
                        onPress={() => setPwdAdmin({ id: a.id_admin, usuario: a.usuario, password: '' })}
                        style={styles.tinyBtn}
                      />
                      <PrimaryButton
                        variant={activo ? 'warning' : 'success'}
                        title={activo ? 'Desactivar' : 'Activar'}
                        onPress={() =>
                          setConfirm({
                            titulo: activo ? 'Desactivar administrador' : 'Activar administrador',
                            mensaje: `¿Confirmas ${activo ? 'desactivar' : 'activar'} a @${a.usuario}?`,
                            action: () => toggleAdmin(a),
                          })
                        }
                        style={styles.tinyBtn}
                      />
                    </View>
                  </ThemedView>
                );
              })}
            </View>
          )}
        </ThemedView>
      </ThemedView>

      <FormModal
        visible={deptForm !== null}
        title={deptForm?.editing ? 'Editar departamento' : 'Nuevo departamento'}
        onCancel={() => setDeptForm(null)}
        onSubmit={guardarDepartamento}>
        <Field label="Nombre" value={deptForm?.nombre ?? ''} onChangeText={(t) => deptForm && setDeptForm({ ...deptForm, nombre: t })} />
        <Field label="Descripción" value={deptForm?.descripcion ?? ''} onChangeText={(t) => deptForm && setDeptForm({ ...deptForm, descripcion: t })} />
      </FormModal>

      <FormModal
        visible={adminForm !== null}
        title={adminForm?.editing ? 'Editar administrador' : 'Nuevo administrador'}
        onCancel={() => setAdminForm(null)}
        onSubmit={guardarAdmin}>
        <Field label="Usuario" value={adminForm?.usuario ?? ''} onChangeText={(t) => adminForm && setAdminForm({ ...adminForm, usuario: t })} autoCapitalize="none" />
        <Field label="Nombre" value={adminForm?.nombre ?? ''} onChangeText={(t) => adminForm && setAdminForm({ ...adminForm, nombre: t })} />
        {!adminForm?.editing ? (
          <Field label="Contraseña inicial" value={adminForm?.password ?? ''} onChangeText={(t) => adminForm && setAdminForm({ ...adminForm, password: t })} secureTextEntry placeholder="Mínimo 6 caracteres" />
        ) : null}
      </FormModal>

      <FormModal
        visible={pwdAdmin !== null}
        title={pwdAdmin ? `Contraseña de @${pwdAdmin.usuario}` : ''}
        submitLabel="Guardar contraseña"
        onCancel={() => setPwdAdmin(null)}
        onSubmit={guardarPwdAdmin}>
        <Field label="Nueva contraseña" placeholder="Mínimo 6 caracteres" value={pwdAdmin?.password ?? ''} onChangeText={(t) => pwdAdmin && setPwdAdmin({ ...pwdAdmin, password: t })} secureTextEntry />
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
  section: { borderRadius: Spacing.four, padding: Spacing.three, gap: Spacing.three },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  sectionTitle: { marginTop: Spacing.half },
  smallBtn: { minHeight: 44, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Spacing.three },
  list: { gap: Spacing.two },
  item: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  itemTitle: { flex: 1, fontSize: 16 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'flex-end' },
  activoPill: { paddingVertical: Spacing.half, paddingHorizontal: Spacing.two, borderRadius: Spacing.four },
  tinyBtn: { minHeight: 44, paddingVertical: Spacing.two, paddingHorizontal: Spacing.two, borderRadius: Spacing.two },
});