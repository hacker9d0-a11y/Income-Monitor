import { useState, useEffect } from 'react';

const HASH_KEY = 'randy_bank_password_hash';
const EXPIRY_KEY = 'randy_bank_session_expiry';
const START_KEY = 'randy_bank_start_time';
const RATE_KEY = 'randy_bank_hourly_rate';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export type AuthState = 'loading' | 'setup' | 'login' | 'dashboard';

export function useBankState() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number>(100);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    const hash = localStorage.getItem(HASH_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    const start = localStorage.getItem(START_KEY);
    const rate = localStorage.getItem(RATE_KEY);

    if (rate) {
      setHourlyRate(Number(rate));
    } else {
      localStorage.setItem(RATE_KEY, '100');
    }

    if (!hash) {
      setAuthState('setup');
      return;
    }

    if (!expiry || new Date(expiry).getTime() < Date.now()) {
      localStorage.removeItem(EXPIRY_KEY);
      setAuthState('login');
      return;
    }

    setStartTime(start);
    setAuthState('dashboard');
  };

  const setupAccount = async (password: string) => {
    const hash = await hashPassword(password);
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const start = now.toISOString();

    localStorage.setItem(HASH_KEY, hash);
    localStorage.setItem(EXPIRY_KEY, expiry);
    localStorage.setItem(START_KEY, start);
    localStorage.setItem(RATE_KEY, '100');

    setStartTime(start);
    setHourlyRate(100);
    setAuthState('dashboard');
  };

  const login = async (password: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(HASH_KEY);
    const hash = await hashPassword(password);

    if (hash === storedHash) {
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(EXPIRY_KEY, expiry);
      setStartTime(localStorage.getItem(START_KEY));
      setAuthState('dashboard');
      return true;
    }
    return false;
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
