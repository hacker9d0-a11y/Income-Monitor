import { useState, useEffect } from 'react';

// Only the "remember me" session marker stays local — it's just a
// convenience so the person isn't asked for their password every visit.
// The actual account data (password hash, start time, hourly rate) now
// lives in Postgres via the API, so it survives clearing browser data,
// switching devices, or closing the editor.
const EXPIRY_KEY = 'randy_bank_session_expiry';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

export type AuthState = 'loading' | 'setup' | 'login' | 'dashboard';

function hasValidSession(): boolean {
  const expiry = localStorage.getItem(EXPIRY_KEY);
  if (!expiry || new Date(expiry).getTime() < Date.now()) {
    localStorage.removeItem(EXPIRY_KEY);
    return false;
  }
  return true;
}

function markSession() {
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  localStorage.setItem(EXPIRY_KEY, expiry);
}

export function useBankState() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(100);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { status, data } = await apiRequest<{ startTime: string; hourlyRate: number }>('/bank/account');

    if (status === 404) {
      setAuthState('setup');
      return;
    }

    if (!data) {
      // API unreachable — don't strand the person on a blank loading screen.
      setAuthState('login');
      return;
    }

    setStartTime(data.startTime);
    setHourlyRate(data.hourlyRate);
    setAuthState(hasValidSession() ? 'dashboard' : 'login');
  };

  const setupAccount = async (password: string) => {
    const passwordHash = await hashPassword(password);
    const { status, data } = await apiRequest<{ startTime: string; hourlyRate: number }>(
      '/bank/account/setup',
      { method: 'POST', body: JSON.stringify({ passwordHash }) },
    );

    if (status !== 201 || !data) return false;

    markSession();
    setStartTime(data.startTime);
    setHourlyRate(data.hourlyRate);
    setAuthState('dashboard');
    return true;
  };

  const login = async (password: string): Promise<boolean> => {
    const passwordHash = await hashPassword(password);
    const { status, data } = await apiRequest<{ startTime: string; hourlyRate: number }>(
      '/bank/account/login',
      { method: 'POST', body: JSON.stringify({ passwordHash }) },
    );

    if (status !== 200 || !data) return false;

    markSession();
    setStartTime(data.startTime);
    setHourlyRate(data.hourlyRate);
    setAuthState('dashboard');
    return true;
  };

  const logout = () => {
    localStorage.removeItem(EXPIRY_KEY);
    setAuthState('login');
  };

  return {
    authState,
    startTime,
    hourlyRate,
    setupAccount,
    login,
    logout,
  };
}
