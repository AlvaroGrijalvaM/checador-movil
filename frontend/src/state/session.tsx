import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AdminInfo, Empleado } from '@/api/contract';
import { STORAGE_KEYS } from '@/config';
import { getItem, removeItem, setItem } from './storage';

export interface Session {
  token: string;
  rol: 'empleado' | 'admin';
  empleado?: Empleado;
  admin?: AdminInfo;
}

interface SessionContextValue {
  session: Session | null;
  status: 'loading' | 'ready';
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function normalize(raw: unknown): Session | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<Session>;
  if (!s.token) return null;
  if (s.rol === 'admin') {
    return { token: s.token, rol: 'admin', admin: s.admin } as Session;
  }
  // Sesiones antiguas o de empleado
  return { token: s.token, rol: 'empleado', empleado: s.empleado } as Session;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await getItem(STORAGE_KEYS.session);
        if (alive && raw) setSession(normalize(JSON.parse(raw)));
      } catch {
        // sin sesion guardada
      }
      if (alive) setStatus('ready');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      status,
      signIn: async (s: Session) => {
        setSession(s);
        await setItem(STORAGE_KEYS.session, JSON.stringify(s)).catch(() => {});
      },
      signOut: async () => {
        setSession(null);
        await removeItem(STORAGE_KEYS.session).catch(() => {});
      },
    }),
    [session, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}