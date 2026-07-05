import React, { useState, useEffect, useRef } from 'react';
import {
  Building, User, CreditCard, PlusCircle,
  Sparkles, Clock, BellOff, TrendingUp, ChevronDown,
  Landmark, Hash, ArrowDownToLine, Timer, Users, MapPin, Monitor
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DashboardProps {
  startTime: string | null;
  hourlyRate: number;
  logout: () => void;
}

// ── Visitor tracking ──────────────────────────────────────────────────────────
interface Visitor {
  id: string;
  name: string;
  device: string;
  location: string;
  flag: string;
  time: string; // ISO
}

const VISITOR_NAMES = [
  'Carlos M.','Alejandro R.','María G.','Valentina P.','Juan C.',
  'Sofia L.','Diego H.','Isabella F.','Andrés T.','Camila V.',
  'Luis E.','Daniela O.','Miguel S.','Gabriela N.','Pablo A.',
  'Luciana B.','Roberto J.','Natalia K.','Fernando W.','Valeria Q.',
];

const VISITOR_LOCATIONS = [
  { city: 'Santo Domingo', flag: '🇩🇴' },
  { city: 'Santiago, RD',  flag: '🇩🇴' },
  { city: 'La Romana',     flag: '🇩🇴' },
  { city: 'Miami, FL',     flag: '🇺🇸' },
  { city: 'New York, NY',  flag: '🇺🇸' },
  { city: 'Barcelona',     flag: '🇪🇸' },
  { city: 'Ciudad de México', flag: '🇲🇽' },
  { city: 'Bogotá',        flag: '🇨🇴' },
  { city: 'Buenos Aires',  flag: '🇦🇷' },
  { city: 'San Juan, PR',  flag: '🇵🇷' },
  { city: 'Caracas',       flag: '🇻🇪' },
  { city: 'Lima',          flag: '🇵🇪' },
];

const VISITOR_DEVICES = ['iPhone 15','Samsung Galaxy S24','MacBook Pro','Windows PC','iPad Pro','Pixel 8','OnePlus 12','Xiaomi 14'];

const VISITORS_KEY = 'randy_bank_visitors';
const VISITOR_SESSION_KEY = 'randy_bank_visitor_added';

function detectDevice(): string {
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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadVisitors(): Visitor[] {
  try {
    return JSON.parse(localStorage.getItem(VISITORS_KEY) ?? '[]');
  } catch { return []; }
}

function saveVisitors(v: Visitor[]) {
  localStorage.setItem(VISITORS_KEY, JSON.stringify(v));
}

function addCurrentVisitor(visitors: Visitor[]): Visitor[] {
  if (sessionStorage.getItem(VISITOR_SESSION_KEY)) return visitors;
  const loc = pickRandom(VISITOR_LOCATIONS);
  const entry: Visitor = {
    id: crypto.randomUUID(),
    name: pickRandom(VISITOR_NAMES),
    device: detectDevice(),
    location: loc.city,
    flag: loc.flag,
    time: new Date().toISOString(),
  };
  const updated = [entry, ...visitors].slice(0, 50); // keep last 50
  saveVisitors(updated);
  sessionStorage.setItem(VISITOR_SESSION_KEY, '1');
  return updated;
}

// ── Dominican Republic banks ──────────────────────────────────────────────────
const BANKS = [
  { id: 'popular',    name: 'Banco Popular',    maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
  { id: 'banreservas',name: 'Banreservas',       maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'bhd',        name: 'Banco BHD',         maxLength: 14, placeholder: '14 dígitos (ej: 12345678901234)' },
  { id: 'apap',       name: 'APAP',              maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
  { id: 'scotiabank', name: 'Scotiabank RD',     maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'santacruz',  name: 'Banco Santa Cruz',  maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
  { id: 'promerica',  name: 'Banco Promerica',   maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'caribe',     name: 'Banco Caribe',      maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'lafise',     name: 'Banco LAFISE',      maxLength: 10, placeholder: '10 dígitos (ej: 1234567890)' },
  { id: 'vimenca',    name: 'Banco Vimenca',     maxLength: 9,  placeholder: '9 dígitos (ej: 123456789)' },
] as const;

type BankId = typeof BANKS[number]['id'];

const SIM_DURATION = 12 * 3600; // 12 hours fixed
const MIN_DEPOSIT = 100;

export function DashboardScreen({ startTime, hourlyRate, logout }: DashboardProps) {
  // ── Existing balance / timer state ─────────────────────────────────────────
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [timerText, setTimerText]         = useState('00:00:00');
  const [progress, setProgress]           = useState(0);

  // ── Visitor state ──────────────────────────────────────────────────────────
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  // ── Bank-selector state ────────────────────────────────────────────────────
  const [selectedBankId, setSelectedBankId] = useState<BankId | null>(null);
  const [accountNumber, setAccountNumber]   = useState('');

  // ── Deposit simulation state ───────────────────────────────────────────────
  const [depositAmount, setDepositAmount] = useState('');
  const [simRunning, setSimRunning]       = useState(false);
  const [simRemaining, setSimRemaining]   = useState(0);
  const [simTotal, setSimTotal]           = useState(0);
  const [simDone, setSimDone]             = useState(false);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load + register visitor on mount ──────────────────────────────────────
  useEffect(() => {
    const loaded = loadVisitors();
    const updated = addCurrentVisitor(loaded);
    setVisitors(updated);
  }, []);

  // ── Balance / timer effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (!startTime) return;

    const calculate = () => {
      const startMs        = new Date(startTime).getTime();
      const elapsedMs      = Date.now() - startMs;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      const earned = Math.floor(elapsedSeconds / 3600);
      setCreditsEarned(earned);

      const secondsIntoCurrentHour = elapsedSeconds % 3600;
      const secondsUntilNext       = 3600 - secondsIntoCurrentHour;

      setProgress((secondsIntoCurrentHour / 3600) * 100);

      const h = Math.floor(secondsUntilNext / 3600);
      const m = Math.floor((secondsUntilNext % 3600) / 60);
      const s = secondsUntilNext % 60;
      setTimerText(
        `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
      );
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startTime, hourlyRate]);

  // ── Deposit simulation effect ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, []);

  // ── Derived balance (hourly credits + $0.50 per visitor) ──────────────────
  const visitorBonus = visitors.length * 0.5;
  const balance = creditsEarned * hourlyRate + visitorBonus;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

  const selectedBank = BANKS.find(b => b.id === selectedBankId) ?? null;

  const handleBankSelect = (id: BankId) => {
    setSelectedBankId(id);
    setAccountNumber('');
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const max = selectedBank?.maxLength ?? 20;
    setAccountNumber(raw.slice(0, max));
  };

  const formatSimTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startSimulation = () => {
    if (simRef.current) clearInterval(simRef.current);
    setSimDone(false);
    setSimRunning(true);
    setSimRemaining(SIM_DURATION);
    setSimTotal(SIM_DURATION);

    simRef.current = setInterval(() => {
      setSimRemaining(prev => {
        if (prev <= 1) {
          clearInterval(simRef.current!);
          setSimRunning(false);
          setSimDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSimulation = () => {
    if (simRef.current) clearInterval(simRef.current);
    setSimRunning(false);
    setSimDone(false);
    setSimRemaining(0);
    setSimTotal(0);
  };

  const simProgress = simTotal > 0 ? ((simTotal - simRemaining) / simTotal) * 100 : 0;

  // ── Transaction history ────────────────────────────────────────────────────
  const transactions = Array.from({ length: Math.min(creditsEarned, 10) }).map((_, i) => {
    const date = new Date(new Date(startTime!).getTime() + (creditsEarned - i) * 3600 * 1000);
    return { id: i, date, amount: hourlyRate };
  });

  const dailyRate = hourlyRate * 24;
  const lastCreditTime = creditsEarned > 0
    ? new Date(new Date(startTime!).getTime() + creditsEarned * 3600 * 1000)
    : null;

  let timeAgoText = '';
  if (lastCreditTime) {
    const hoursAgo = Math.floor((Date.now() - lastCreditTime.getTime()) / (1000 * 3600));
    timeAgoText = hoursAgo === 0 ? 'Hace menos de una hora'
      : hoursAgo === 1 ? 'Hace 1 hora'
      : `Hace ${hoursAgo} horas`;
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center p-4 md:p-6 pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="w-full max-w-[420px] flex flex-col space-y-6 relative z-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-bold tracking-tight text-sm">Randy Alejandro Bank</h1>
              <p className="text-muted-foreground text-xs font-medium">Generative Savings Account</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="button-user-menu"
                  className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-white hover:bg-card transition-colors"
                >
                  <User className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-card-border">
                <DropdownMenuItem className="text-muted-foreground focus:text-white focus:bg-background cursor-pointer">
                  Detalles de cuenta
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Balance Card ────────────────────────────────────────────────── */}
        <div className="bg-card rounded-[1.5rem] p-6 border border-card-border shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />

          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-2 text-muted-foreground text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              <span>Saldo disponible</span>
            </div>
            <button className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors">
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-1">
            <span
              data-testid="text-balance"
              className="text-4xl md:text-5xl font-bold tracking-tighter text-white tabular-nums"
            >
              {formatCurrency(balance)}
            </span>
          </div>
          <p className="text-muted-foreground text-xs mb-8">Cuenta terminada en 0001</p>

          {/* Inner timer card */}
          <div className="bg-[#0c1219] rounded-xl p-4 border border-card-border relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-primary font-semibold text-sm">+{formatCurrency(hourlyRate)} / hora</span>
              </div>
              <div className="flex items-center space-x-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span data-testid="text-timer" className="text-sm font-medium tabular-nums">{timerText}</span>
              </div>
            </div>

            <div className="h-1.5 w-full bg-card rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-[11px] text-muted-foreground text-center font-medium">
              Próximo {formatCurrency(hourlyRate)} acreditado en {timerText}
            </p>
          </div>
        </div>

        {/* ── Notifications Alert ─────────────────────────────────────────── */}
        <div className="bg-card rounded-xl p-4 border border-card-border flex items-start space-x-4 shadow-sm">
          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-muted-foreground shrink-0 border border-card-border">
            <BellOff className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white text-sm font-semibold mb-0.5">Notificaciones en tu teléfono</h3>
            <p className="text-muted-foreground text-xs">Las notificaciones push no están disponibles en este navegador</p>
          </div>
        </div>

        {/* ── Stats Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-5 border border-card-border shadow-sm">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-muted-foreground text-xs font-medium mb-1">Tasa diaria</p>
            <p className="text-white text-lg font-bold">{formatCurrency(dailyRate)}</p>
          </div>

          <div className="bg-card rounded-xl p-5 border border-card-border shadow-sm">
            <div className="h-8 w-8 bg-background rounded-lg flex items-center justify-center text-muted-foreground mb-3 border border-card-border">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-muted-foreground text-xs font-medium mb-1">Último crédito</p>
            <div className="flex flex-col">
              <p className="text-primary text-sm font-bold mb-0.5">+{formatCurrency(hourlyRate)}</p>
              <p className="text-[10px] text-muted-foreground truncate" title={timeAgoText || 'Sin créditos aún'}>
                {timeAgoText || 'Sin créditos aún'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Bank Selector Form ──────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center space-x-2">
            <Landmark className="w-4 h-4 text-primary" />
            <h3 className="text-white text-sm font-semibold">Transferencia bancaria</h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Bank selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Banco</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="button-bank-select"
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-left hover:border-primary/40 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <span className={selectedBank ? 'text-white' : 'text-muted-foreground'}>
                      {selectedBank?.name ?? 'Selecciona un banco'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[var(--radix-dropdown-menu-trigger-width)] bg-card border-card-border max-h-60 overflow-y-auto"
                  align="start"
                >
                  {BANKS.map(bank => (
                    <DropdownMenuItem
                      key={bank.id}
                      data-testid={`option-bank-${bank.id}`}
                      onSelect={() => handleBankSelect(bank.id)}
                      className={`cursor-pointer text-sm ${
                        selectedBankId === bank.id
                          ? 'text-primary bg-primary/10 focus:text-primary focus:bg-primary/10'
                          : 'text-white focus:text-white focus:bg-background'
                      }`}
                    >
                      {bank.name}
                      <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                        {bank.maxLength} díg.
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Account number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center space-x-1.5">
                <Hash className="w-3 h-3" />
                <span>Número de cuenta</span>
                {selectedBank && (
                  <span className="text-primary/70 font-mono text-[10px]">
                    (máx. {selectedBank.maxLength} dígitos)
                  </span>
                )}
              </label>
              <input
                data-testid="input-account-number"
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={handleAccountNumberChange}
                disabled={!selectedBank}
                placeholder={selectedBank?.placeholder ?? 'Selecciona un banco primero'}
                maxLength={selectedBank?.maxLength ?? 20}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-white placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              />
              {selectedBank && accountNumber.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground/60">
                    {accountNumber.length} / {selectedBank.maxLength} dígitos
                  </span>
                  {accountNumber.length === selectedBank.maxLength && (
                    <span className="text-[10px] text-primary font-medium">Longitud válida</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Información del depósito ────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          {/* Header with SIMULACIÓN badge */}
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowDownToLine className="w-4 h-4 text-primary" />
              <h3 className="text-white text-sm font-semibold">Información del depósito</h3>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Deposit amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Monto a depositar (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">$</span>
                <input
                  data-testid="input-deposit-amount"
                  type="text"
                  inputMode="decimal"
                  value={depositAmount}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    setDepositAmount(raw);
                  }}
                  placeholder={formatCurrency(balance).replace('$', '').trim()}
                  className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/40 transition-colors font-mono"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Saldo actual: <span className="text-primary">{formatCurrency(balance)}</span>
              </p>
            </div>

            {/* Duration selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center space-x-1.5">
                <Timer className="w-3 h-3" />
                <span>Tiempo estimado</span>
              </label>
              <div className="px-3 py-2.5 rounded-lg bg-background border border-card-border text-sm text-white font-mono select-none cursor-default">
                1 hora
              </div>
            </div>

            {/* Countdown + progress bar (shown while running or done) */}
            {(simRunning || simDone) && (
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {simDone ? 'Depósito completado' : 'Procesando depósito...'}
                  </span>
                  <span
                    data-testid="text-sim-countdown"
                    className={`text-sm font-bold tabular-nums font-mono ${simDone ? 'text-primary' : 'text-white'}`}
                  >
                    {simDone ? '00:00' : formatSimTime(simRemaining)}
                  </span>
                </div>

                <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-card-border">
                  <div
                    data-testid="bar-sim-progress"
                    className={`h-full rounded-full transition-all duration-1000 ease-linear ${simDone ? 'bg-primary' : 'bg-primary/80'}`}
                    style={{ width: `${simDone ? 100 : simProgress}%` }}
                  />
                </div>

                {simDone && (
                  <div className="flex items-center justify-center space-x-2 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary text-xs font-semibold">
                      {depositAmount
                        ? `$${parseFloat(depositAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })} depositado`
                        : 'Depósito completado'
                      } (simulado)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              {!simRunning ? (
                <button
                  data-testid="button-start-sim"
                  onClick={startSimulation}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-background text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all"
                >
                  {simDone ? 'Confirmar transferencia' : 'Confirmar transferencia'}
                </button>
              ) : (
                <button
                  data-testid="button-cancel-sim"
                  onClick={cancelSimulation}
                  className="flex-1 py-2.5 rounded-lg bg-background border border-card-border text-muted-foreground text-sm font-semibold hover:text-white hover:border-primary/30 transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── Transaction history ──────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-card-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-card-border">
            <h3 className="text-white text-sm font-semibold">Historial de transacciones</h3>
          </div>
          <div className="p-0">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Sin créditos aún. Vuelve en una hora.
              </div>
            ) : (
              <div className="divide-y divide-card-border">
                {transactions.map(t => (
                  <div
                    key={t.id}
                    data-testid={`row-transaction-${t.id}`}
                    className="flex justify-between items-center p-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">Crédito generativo</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {t.date.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-primary font-semibold text-sm">+{formatCurrency(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Visitor history ──────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-card-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="text-white text-sm font-semibold">Historial de usuarios</h3>
            </div>
            <span className="text-[10px] text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              +{formatCurrency(visitorBonus)} generado
            </span>
          </div>
          <div className="p-0">
            {visitors.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Sin visitas registradas.
              </div>
            ) : (
              <div className="divide-y divide-card-border">
                {visitors.map((v, idx) => {
                  const visitDate = new Date(v.time);
                  return (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Avatar circle */}
                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 text-xs font-bold">
                          {v.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{v.name}</p>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <div className="flex items-center space-x-1 text-muted-foreground text-[10px]">
                              <Monitor className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{v.device}</span>
                            </div>
                            <span className="text-card-border">·</span>
                            <div className="flex items-center space-x-1 text-muted-foreground text-[10px]">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{v.flag} {v.location}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground/50 text-[10px] mt-0.5">
                            {visitDate.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-primary font-semibold text-xs shrink-0 ml-2">+$0.50</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
