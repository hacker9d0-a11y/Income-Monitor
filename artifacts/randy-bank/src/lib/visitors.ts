// ── Visitor tracking (shared) ───────────────────────────────────────────────
// Used by the dashboard's "Historial de usuarios" card and by the hidden
// /invite page. Everything is stored client-side in localStorage — there is
// no real personal data involved, just generic placeholder info.

export interface Visitor {
  id: string;
  name: string;
  device: string;
  location: string;
  flag: string;
  time: string; // ISO
  source?: 'organic' | 'invite';
}

const VISITOR_NAMES = [
  'Carlos M.', 'Alejandro R.', 'María G.', 'Valentina P.', 'Juan C.',
  'Sofia L.', 'Diego H.', 'Isabella F.', 'Andrés T.', 'Camila V.',
  'Luis E.', 'Daniela O.', 'Miguel S.', 'Gabriela N.', 'Pablo A.',
  'Luciana B.', 'Roberto J.', 'Natalia K.', 'Fernando W.', 'Valeria Q.',
];

const VISITOR_LOCATIONS = [
  { city: 'Santo Domingo', flag: '🇩🇴' },
  { city: 'Santiago, RD', flag: '🇩🇴' },
  { city: 'La Romana', flag: '🇩🇴' },
  { city: 'Miami, FL', flag: '🇺🇸' },
  { city: 'New York, NY', flag: '🇺🇸' },
  { city: 'Barcelona', flag: '🇪🇸' },
  { city: 'Ciudad de México', flag: '🇲🇽' },
  { city: 'Bogotá', flag: '🇨🇴' },
  { city: 'Buenos Aires', flag: '🇦🇷' },
  { city: 'San Juan, PR', flag: '🇵🇷' },
  { city: 'Caracas', flag: '🇻🇪' },
  { city: 'Lima', flag: '🇵🇪' },
];

const VISITOR_DEVICES = ['iPhone 15', 'Samsung Galaxy S24', 'MacBook Pro', 'Windows PC', 'iPad Pro', 'Pixel 8', 'OnePlus 12', 'Xiaomi 14'];

export const VISITORS_KEY = 'randy_bank_visitors';

export function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android.*Mobile/.test(ua)) return 'Android Phone';
  if (/Android/.test(ua)) return 'Android Tablet';
  if (/Macintosh/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux PC';
  return 'Dispositivo desconocido';
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function loadVisitors(): Visitor[] {
  try {
    return JSON.parse(localStorage.getItem(VISITORS_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveVisitors(v: Visitor[]) {
  localStorage.setItem(VISITORS_KEY, JSON.stringify(v));
}

function buildGenericVisitor(source: Visitor['source']): Visitor {
  const loc = pickRandom(VISITOR_LOCATIONS);
  return {
    id: crypto.randomUUID(),
    name: pickRandom(VISITOR_NAMES),
    device: detectDevice() === 'Dispositivo desconocido' ? pickRandom(VISITOR_DEVICES) : detectDevice(),
    location: loc.city,
    flag: loc.flag,
    time: new Date().toISOString(),
    source,
  };
}

/** Registers a visitor coming from the hidden invite link, with generic info. */
export function addInviteVisitor(): Visitor {
  const visitors = loadVisitors();
  const entry = buildGenericVisitor('invite');
  const updated = [entry, ...visitors].slice(0, 50);
  saveVisitors(updated);
  return entry;
}
