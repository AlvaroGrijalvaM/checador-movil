/**
 * Cliente HTTP de la API (Modo Servidor) + fabrica createApi.
 *
 * Los endpoints mapean 1:1 a los stored procedures del backend/checador_db.
 */
import type { AppConfig } from '@/config';
import {
  ApiError,
  type AdminInfo,
  type AdminResult,
  type CheckResult,
  type ChecadaRegistro,
  type ChecadorApi,
  type Departamento,
  type EditarEmpleado,
  type Empleado,
  type EstadoChecadaInfo,
  type Horario,
  type LoginAdminResult,
  type LoginEmpleadoResult,
  type NuevoEmpleado,
  type NuevoHorario,
  type ReporteRow,

} from './contract';


interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: boolean;
}

/**
 * Handler global llamado cuando la API responde 401 (token expirado/invalido).
 * El layout raiz lo conecta para cerrar la sesion automaticamente.
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(cb: (() => void) | null): void {
  unauthorizedHandler = cb;
}

function notifyUnauthorized(): void {
  unauthorizedHandler?.();
}

/**
 * Resuelve la URL base de la API (quitando la barra final).
 * La URL se define en el archivo .env del frontend (EXPO_PUBLIC_API_URL).
 */
export function resolveApiBaseUrl(config: { apiUrl: string }): string {
  return config.apiUrl.replace(/\/+$/, '');
}

export class HttpChecadorApi implements ChecadorApi {
  constructor(
    private baseUrl: string,
    private getToken: () => string | null,
  ) {}

  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token = true } = opts;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (token) {
      const t = this.getToken();
      if (t) headers.Authorization = `Bearer ${t}`;
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl.replace(/\/+$/, '')}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('No se pudo conectar con el servidor. Verifica en Ajustes la URL del API y que el backend esté activo (cd backend && npm run dev).', 0);
    }

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      if (token && res.status === 401) notifyUnauthorized();
      const mensaje = (data && (data.mensaje || data.message)) || `Error del servidor (${res.status})`;
      throw new ApiError(String(mensaje), res.status);
    }
    return data as T;
  }

  // ========== EMPLEADO ==========

  loginEmpleado(numero: string, password: string): Promise<LoginEmpleadoResult> {
    return this.request<LoginEmpleadoResult>('/api/auth/empleado', {
      method: 'POST',
      body: { numero_empleado: numero, password },
      token: false,
    });
  }

  obtenerEmpleado(numero: string): Promise<Empleado | null> {
    return this.request<Empleado>(`/api/empleados/${encodeURIComponent(numero)}`);
  }

  estadoChecada(numero: string): Promise<EstadoChecadaInfo | null> {
    return this.request<EstadoChecadaInfo>(`/api/empleados/${encodeURIComponent(numero)}/estado`);
  }

  registrarEntrada(numero: string, fotoUrl?: string | null): Promise<CheckResult> {
    return this.request<CheckResult>(`/api/empleados/${encodeURIComponent(numero)}/entrada`, {
      method: 'POST',
      body: { foto_url: fotoUrl ?? null },
    });
  }

  registrarSalida(numero: string, fotoUrl?: string | null): Promise<CheckResult> {
    return this.request<CheckResult>(`/api/empleados/${encodeURIComponent(numero)}/salida`, {
      method: 'POST',
      body: { foto_url: fotoUrl ?? null },
    });
  }

  historial(numero: string): Promise<ChecadaRegistro[]> {
    return this.request<ChecadaRegistro[]>(`/api/empleados/${encodeURIComponent(numero)}/historial`);
  }



  async uploadFoto(dataBase64: string, filename: string): Promise<string | null> {
    try {
      const res = await this.request<{ url: string }>('/api/uploads/base64', {
        method: 'POST',
        body: { data: dataBase64, filename },
        token: false,
      });
      return res?.url ?? null;
    } catch {
      return null;
    }
  }

  // ========== ADMIN: AUTH ==========

  loginAdmin(usuario: string, password: string): Promise<LoginAdminResult> {
    return this.request<LoginAdminResult>('/api/auth/admin', {
      method: 'POST',
      body: { usuario, password },
      token: false,
    });
  }

  // ========== ADMIN: ADMINISTRADORES ==========

  listarAdmins(): Promise<AdminInfo[]> {
    return this.request<AdminInfo[]>('/api/admin/admins');
  }

  crearAdmin(d: { usuario: string; password: string; nombre: string }): Promise<AdminResult> {
    return this.request<AdminResult>('/api/admin/admins', { method: 'POST', body: d });
  }

  actualizarAdmin(id: number, d: { usuario: string; nombre: string }): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/admins/${id}`, { method: 'PUT', body: d });
  }

  cambiarPasswordAdmin(id: number, password: string): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/admins/${id}/password`, { method: 'PUT', body: { password } });
  }

  activarAdmin(id: number, activo: boolean): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/admins/${id}/${activo ? 'activar' : 'desactivar'}`, { method: 'POST' });
  }

  // ========== ADMIN: DEPARTAMENTOS ==========

  listarDepartamentos(): Promise<Departamento[]> {
    return this.request<Departamento[]>('/api/admin/departamentos');
  }

  crearDepartamento(nombre: string, descripcion?: string): Promise<AdminResult> {
    return this.request<AdminResult>('/api/admin/departamentos', { method: 'POST', body: { nombre_departamento: nombre, descripcion } });
  }

  actualizarDepartamento(id: number, nombre: string, descripcion?: string): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/departamentos/${id}`, { method: 'PUT', body: { nombre_departamento: nombre, descripcion } });
  }

  activarDepartamento(id: number, activo: boolean): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/departamentos/${id}/${activo ? 'activar' : 'desactivar'}`, { method: 'POST' });
  }

  // ========== ADMIN: EMPLEADOS ==========

  listarEmpleadosAdmin(): Promise<Empleado[]> {
    return this.request<Empleado[]>('/api/admin/empleados');
  }

  buscarEmpleados(texto: string): Promise<Empleado[]> {
    return this.request<Empleado[]>(`/api/admin/empleados/buscar?texto=${encodeURIComponent(texto)}`);
  }

  crearEmpleado(d: NuevoEmpleado): Promise<AdminResult> {
    return this.request<AdminResult>('/api/admin/empleados', { method: 'POST', body: d });
  }

  actualizarEmpleado(id: number, d: EditarEmpleado): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/empleados/${id}`, { method: 'PUT', body: d });
  }

  activarEmpleado(id: number, activo: boolean): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/empleados/${id}/${activo ? 'activar' : 'desactivar'}`, { method: 'POST' });
  }

  cambiarPasswordEmpleado(numero: string, password: string): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/empleados/${encodeURIComponent(numero)}/password`, {
      method: 'PUT',
      body: { numero_empleado: numero, password },
    });
  }

  historialEmpleadoAdmin(numero: string): Promise<ChecadaRegistro[]> {
    return this.request<ChecadaRegistro[]>(`/api/admin/empleados/${encodeURIComponent(numero)}/historial`);
  }

  // ========== ADMIN: HORARIOS ==========

  listarHorarios(idEmpleado: number): Promise<Horario[]> {
    return this.request<Horario[]>(`/api/admin/empleados/${idEmpleado}/horarios`);
  }

  crearHorario(idEmpleado: number, d: NuevoHorario): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/empleados/${idEmpleado}/horarios`, { method: 'POST', body: d });
  }

  actualizarHorario(idHorario: number, d: NuevoHorario): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/horarios/${idHorario}`, { method: 'PUT', body: d });
  }

  eliminarHorario(idHorario: number): Promise<AdminResult> {
    return this.request<AdminResult>(`/api/admin/horarios/${idHorario}`, { method: 'DELETE' });
  }

  // ========== ADMIN: REPORTES ==========

  reporteFecha(fecha: string): Promise<ReporteRow[]> {
    return this.request<ReporteRow[]>(`/api/admin/reportes/fecha?fecha=${encodeURIComponent(fecha)}`);
  }
}

/** Fabrica la implementacion de la API segun la configuracion de la app. */
export function createApi(config: AppConfig, getToken: () => string | null): ChecadorApi {
  return new HttpChecadorApi(resolveApiBaseUrl(config), getToken);
}