/**
 * Tipos del contrato REST entre la app movil (frontend) y la API (backend).
 * Cada forma refleja las columnas que devuelven los stored procedures de checador_db.
 */

export type EstadoChecada = 'SIN_CHECADA' | 'ENTRADA_ABIERTA' | 'JORNADA_COMPLETA';
export type EstadoRegistro = 'A_TIEMPO' | 'RETARDO';

export interface Empleado {
  id_empleado: number;
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  nombre_completo: string;
  id_departamento: number;
  nombre_departamento: string;
  foto_url: string | null;
  activo: boolean | 0 | 1;
  fecha_ingreso: string | null;
}

export interface AdminInfo {
  id_admin: number;
  usuario: string;
  nombre: string;
  activo: boolean | 0 | 1;
  fecha_creacion: string | null;
}

export interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
  descripcion: string | null;
  activo: boolean | 0 | 1;
  fecha_creacion: string | null;
}

export interface Horario {
  id_horario: number;
  id_empleado: number;
  numero_empleado: string;
  nombre_completo?: string;
  dia_semana: number;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
  vigencia: string | null;
}

export interface LoginEmpleadoResult {
  token: string;
  empleado: Empleado;
}

export interface LoginAdminResult {
  token: string;
  admin: AdminInfo;
}

export interface EstadoChecadaInfo {
  id_empleado: number;
  numero_empleado: string;
  nombre_completo: string;
  estado_checada: EstadoChecada;
  id_checada: number | null;
  fecha_entrada: string | null;
  fecha_salida: string | null;
  estado: EstadoRegistro | null;
}

export interface ChecadaRegistro {
  id_checada: number;
  id_empleado?: number;
  numero_empleado?: string;
  nombre_completo?: string;
  fecha_entrada: string;
  fecha_salida: string | null;
  estado: EstadoRegistro;
  foto_entrada_url: string | null;
  foto_salida_url: string | null;
  observaciones: string | null;
}

export interface CheckResult {
  exito: boolean;
  id_checada: number | null;
  estado?: EstadoRegistro;
  fecha_entrada?: string;
  fecha_salida?: string;
  mensaje: string;
}



/** Resultado comun de los procedures de escritura (crear/actualizar/activar). */
export interface AdminResult {
  exito: boolean;
  mensaje: string;
  id_admin?: number;
  id_departamento?: number;
  id_empleado?: number;
  numero_empleado?: string;
  id_horario?: number;
}

export interface NuevoEmpleado {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  id_departamento: number;
  password: string;
  foto_url?: string | null;
  fecha_ingreso?: string | null;
}

export interface EditarEmpleado {
  numero_empleado: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  id_departamento: number;
  foto_url?: string | null;
  fecha_ingreso?: string | null;
}

export interface NuevoHorario {
  dia_semana: number;
  hora_entrada: string;
  hora_salida: string;
  tolerancia_minutos: number;
}

export interface ReporteRow {
  id_checada: number;
  numero_empleado: string;
  nombre_completo: string;
  nombre_departamento: string;
  fecha_entrada: string;
  fecha_salida: string | null;
  estado: EstadoRegistro;
}

/** Contrato que implementa el cliente HTTP de la app. */
export interface ChecadorApi {
  // ---- Empleado ----------------
  loginEmpleado(numero: string, password: string): Promise<LoginEmpleadoResult>;
  obtenerEmpleado(numero: string): Promise<Empleado | null>;
  estadoChecada(numero: string): Promise<EstadoChecadaInfo | null>;
  registrarEntrada(numero: string, fotoUrl?: string | null): Promise<CheckResult>;
  registrarSalida(numero: string, fotoUrl?: string | null): Promise<CheckResult>;
  historial(numero: string): Promise<ChecadaRegistro[]>;

  uploadFoto(dataBase64: string, filename: string): Promise<string | null>;

  // ---- Admin: auth -------------
  loginAdmin(usuario: string, password: string): Promise<LoginAdminResult>;

  // ---- Admin: administradores --
  listarAdmins(): Promise<AdminInfo[]>;
  crearAdmin(d: { usuario: string; password: string; nombre: string }): Promise<AdminResult>;
  actualizarAdmin(id: number, d: { usuario: string; nombre: string }): Promise<AdminResult>;
  cambiarPasswordAdmin(id: number, password: string): Promise<AdminResult>;
  activarAdmin(id: number, activo: boolean): Promise<AdminResult>;

  // ---- Admin: departamentos ----
  listarDepartamentos(): Promise<Departamento[]>;
  crearDepartamento(nombre: string, descripcion?: string): Promise<AdminResult>;
  actualizarDepartamento(id: number, nombre: string, descripcion?: string): Promise<AdminResult>;
  activarDepartamento(id: number, activo: boolean): Promise<AdminResult>;

  // ---- Admin: empleados --------
  listarEmpleadosAdmin(): Promise<Empleado[]>;
  buscarEmpleados(texto: string): Promise<Empleado[]>;
  crearEmpleado(d: NuevoEmpleado): Promise<AdminResult>;
  actualizarEmpleado(id: number, d: EditarEmpleado): Promise<AdminResult>;
  activarEmpleado(id: number, activo: boolean): Promise<AdminResult>;
  cambiarPasswordEmpleado(numero: string, password: string): Promise<AdminResult>;
  historialEmpleadoAdmin(numero: string): Promise<ChecadaRegistro[]>;

  // ---- Admin: horarios ---------
  listarHorarios(idEmpleado: number): Promise<Horario[]>;
  crearHorario(idEmpleado: number, d: NuevoHorario): Promise<AdminResult>;
  actualizarHorario(idHorario: number, d: NuevoHorario): Promise<AdminResult>;
  eliminarHorario(idHorario: number): Promise<AdminResult>;

  // ---- Admin: reportes ---------
  reporteFecha(fecha: string): Promise<ReporteRow[]>;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}