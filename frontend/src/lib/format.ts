/** Utilidades de formato para fechas y horas. */

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTimeSeconds(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDate(value: string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(value: string | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return `${formatDate(value)} ${formatTime(d)}`;
}

export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

export function formatDuration(entrada: string | null | undefined, salida: string | null | undefined): string {
  const a = toDate(entrada);
  const b = toDate(salida);
  if (!a || !b || b.getTime() <= a.getTime()) return '—';
  const mins = Math.round((b.getTime() - a.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${pad(m)}m`;
}

export function monthNameShort(d: Date): string {
  return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()];
}
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export function diaSemanaLabel(n: number): string {
  return DIAS_SEMANA[((n - 1) % 7 + 7) % 7] ?? 'Dia';
}