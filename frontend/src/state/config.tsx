import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEFAULT_CONFIG, STORAGE_KEYS, type AppConfig } from '@/config';
import { getItem, setItem } from './storage';

interface ConfigContextValue {
  config: AppConfig;
  status: 'loading' | 'ready';
  updateConfig: (patch: Partial<AppConfig>) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await getItem(STORAGE_KEYS.config);
        if (alive && raw) setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(raw) });
      } catch {
        // se queda con la configuracion por defecto
      }
      if (alive) setStatus('ready');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      status,
      updateConfig: async (patch: Partial<AppConfig>) => {
        const next = { ...config, ...patch };
        setConfig(next);
        await setItem(STORAGE_KEYS.config, JSON.stringify(next)).catch(() => {});
      },
    }),
    [config, status],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig debe usarse dentro de <ConfigProvider>');
  return ctx;
}