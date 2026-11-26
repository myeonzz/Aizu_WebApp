// In-memory app state for the dashboard demo. A page reload starts fresh.
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { seedEvents, seedVehicles } from './data';
import type { FleetEvent, Review, Vehicle } from './data';

export type Schedule = { rest: boolean; minutes: number; dayShift: boolean; reliever: boolean };
export type IncidentState = {
  steps: Record<string, string | null>; // step key -> time done, or null
  rested: string;
  note: string;
  explanation: string;
  supervisor: string;
  decision: string | null;
  review: 'Confirmed' | 'False alarm' | null;
  closed: boolean;
};
export type ToastKind = 'success' | 'info' | 'error' | 'loading';
type Toast = { id: number; text: string; kind: ToastKind };

type Ctx = {
  signedIn: boolean;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
  email: string;
  events: FleetEvent[];
  reviewEvent: (id: string, r: Review, reason?: string) => void;
  acknowledged: boolean;
  acknowledge: () => void;
  incident: IncidentState;
  setIncident: (p: Partial<IncidentState>) => void;
  schedules: Record<string, Schedule>;
  setSchedule: (id: string, s: Schedule) => void;
  retention: string;
  setRetention: (r: string) => void;
  name: string;
  company: string;
  vehicles: Vehicle[];
  addVehicle: (v: Vehicle) => void;
  toasts: Toast[];
  /** Show a short message. Kind sets the icon and colour. */
  toast: (text: string, kind?: ToastKind) => void;
  /** Simulate work: a spinner toast, then a success toast, then `then` runs. */
  run: (pending: string, done: string, then?: () => void, ms?: number) => void;
  signUp: (name: string, email: string, company?: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

const KEY = 'aizu-fleet-user';
const NAME_KEY = 'aizu-fleet-name';
const CO_KEY = 'aizu-fleet-company';
function readSession(k: string) {
  try {
    return sessionStorage.getItem(k) ?? '';
  } catch {
    return '';
  }
}
function writeSession(k: string, v: string) {
  try {
    if (v) sessionStorage.setItem(k, v);
    else sessionStorage.removeItem(k);
  } catch {
    /* storage blocked: sign-in lasts until reload */
  }
}
/** "maria.santos@x.ph" -> "Maria Santos" */
const nameFromEmail = (e: string) =>
  e.split('@')[0].split(/[._-]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') || 'Fleet manager';

const defaultSchedule: Schedule = { rest: true, minutes: 15, dayShift: false, reliever: false };

export function AppProvider({ children }: { children: ReactNode }) {
  // Sign-in survives a page reload in the same tab (demo only; nothing is checked).
  const [email, setEmail] = useState(() => readSession(KEY));
  const [name, setName] = useState(() => readSession(NAME_KEY));
  const [company, setCompany] = useState(() => readSession(CO_KEY));
  const [vehicles, setVehicles] = useState(seedVehicles);
  const signedIn = email !== '';
  const [events, setEvents] = useState(seedEvents);
  const [acknowledged, setAck] = useState(false);
  const [incident, setInc] = useState<IncidentState>({
    steps: { contacted: '2:48 AM', pulledOver: '2:51 AM', rested: null, dispatcher: null, checked: null },
    rested: '15',
    note: '',
    explanation: '',
    supervisor: '',
    decision: null,
    review: null,
    closed: false,
  });
  const [schedules, setSchedules] = useState<Record<string, Schedule>>({});
  const [retention, setRetention] = useState('30 days (default)');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 5000 : 3500);
  }, []);
  const run = useCallback((pending: string, done: string, then?: () => void, ms = 900) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, text: pending, kind: 'loading' }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
      then?.();
      toast(done, 'success');
    }, ms);
  }, [toast]);

  const value = useMemo<Ctx>(
    () => ({
      signedIn,
      email,
      name: name || nameFromEmail(email),
      company: company || 'Sample Delivery Co.',
      vehicles,
      addVehicle: (v) => setVehicles((p) => [...p, v]),
      signIn: (e, n) => {
        const nm = n || nameFromEmail(e);
        setName(nm);
        writeSession(NAME_KEY, nm);
        setEmail(e);
        writeSession(KEY, e);
      },
      signUp: (n, e, c) => {
        if (c) {
          setCompany(c);
          writeSession(CO_KEY, c);
        }
        setName(n);
        writeSession(NAME_KEY, n);
        setEmail(e);
        writeSession(KEY, e);
      },
      signOut: () => {
        setEmail('');
        setName('');
        setCompany('');
        writeSession(CO_KEY, '');
        writeSession(KEY, '');
        writeSession(NAME_KEY, '');
        setAck(false);
      },
      events,
      reviewEvent: (id, r, reason) => setEvents((p) => p.map((e) => (e.id === id ? { ...e, review: r, reason } : e))),
      acknowledged,
      acknowledge: () => setAck(true),
      incident,
      setIncident: (p) => setInc((s) => ({ ...s, ...p })),
      schedules,
      setSchedule: (id, s) => setSchedules((p) => ({ ...p, [id]: s })),
      retention,
      setRetention,
      toasts,
      toast,
      run,
    }),
    [signedIn, email, name, company, vehicles, events, acknowledged, incident, schedules, retention, toasts, toast, run]
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp must be inside AppProvider');
  return v;
}

export const scheduleFor = (schedules: Record<string, Schedule>, id: string) => schedules[id] ?? defaultSchedule;
