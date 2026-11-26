import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, BellRing, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, CircleCheck, FileChartColumn, Info, LayoutDashboard, Loader2, LogOut,
  Pause, Play, Settings, SkipBack, SkipForward, TriangleAlert, Truck, Users, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { levelInfo } from './data';
import type { Level } from './data';
import { useApp } from './state';
import type { ToastKind } from './state';
import mark from './assets/aizu-mark.png';
import clipSrc from './assets/placeholder-clip.mp4';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---------- Shell ----------
// Same order as the Figma prototype sidebar.
const navItems = [
  { to: '/overview', label: 'Overview', Icon: LayoutDashboard },
  { to: '/vehicles', label: 'Vehicles', Icon: Truck },
  { to: '/drivers', label: 'Drivers', Icon: Users },
  { to: '/events', label: 'Events', Icon: BellRing },
  { to: '/reports', label: 'Reports', Icon: FileChartColumn },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function Shell({ title, children, overlay }: { title: string; children: ReactNode; overlay?: ReactNode }) {
  const { events, email, name, company, signOut, run } = useApp();
  const navigate = useNavigate();
  const unreviewed = events.filter((e) => e.review === 'Not reviewed').length;
  useEffect(() => {
    document.title = `${title} · Aizu Fleet`;
  }, [title]);
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/overview" className="brand" aria-label="Aizu fleet overview">
          <img src={mark} alt="" />
          <span>Aizu</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cx(isActive && 'active')} title={n.label}>
              <n.Icon size={18} />
              <span>{n.label}</span>
              {n.to === '/events' && unreviewed ? <em className="count">{unreviewed}</em> : null}
            </NavLink>
          ))}
        </nav>
        <div className="me">
          <div className="avatar" aria-hidden>{initials(name)}</div>
          <div className="who-block">
            <span className="who">{name}</span>
            <span className="role" title={email}>Fleet Manager</span>
          </div>
          <button className="signout" aria-label="Sign out" title="Sign out" onClick={() => run('Signing out…', 'Signed out', () => { signOut(); navigate('/'); }, 600)}>
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <Link to="/overview" className="mobile-brand" aria-label="Overview">
            <img src={mark} alt="" />
          </Link>
          <h1>{title}</h1>
          <button className="icon-btn bell" aria-label={`Notifications, ${unreviewed} not reviewed`} onClick={() => navigate('/events?unreviewed=1')}>
            <Bell size={20} />
          </button>
          {unreviewed ? <span className="bell-count" aria-hidden>{unreviewed}</span> : null}
          <span className="company">{company}</span>
        </header>
        <main className="content">{children}</main>
      </div>
      <nav className="tabbar" aria-label="Main">
        {navItems.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => cx(isActive && 'active')}>
            <n.Icon size={20} />
            {n.label}
            {n.to === '/events' && unreviewed ? <em className="count">{unreviewed}</em> : null}
          </NavLink>
        ))}
      </nav>
      {overlay}
      <Toasts />
    </div>
  );
}

const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'FM';

const toastIcon = { success: CheckCircle2, info: Info, error: XCircle, loading: Loader2 } as const;
export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => {
        const I = toastIcon[t.kind];
        return (
          <div key={t.id} className={cx('toast', t.kind)}>
            <I size={20} className={t.kind === 'loading' ? 'spin' : undefined} />
            <span>{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Small parts ----------
type BtnProps = { children: ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; small?: boolean; block?: boolean; onClick?: () => void; disabled?: boolean; loading?: boolean; Icon?: LucideIcon; type?: 'button' | 'submit' };
export function Button({ children, variant = 'primary', small, block, onClick, disabled, loading, Icon, type = 'button' }: BtnProps) {
  const I = loading ? Loader2 : Icon;
  return (
    <button type={type} className={cx('btn', variant, small && 'small', block && 'block')} onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined}>
      {I ? <I size={16} className={loading ? 'spin' : undefined} /> : null}
      {children}
    </button>
  );
}

export function Chip({ children, on, onClick, Icon }: { children: ReactNode; on?: boolean; onClick?: () => void; Icon?: LucideIcon }) {
  const I = Icon ?? null;
  return (
    <button type="button" className={cx('chip', on && 'on')} aria-pressed={!!on} onClick={onClick}>
      {I ? <I size={14} /> : null}
      {children}
    </button>
  );
}

export function LevelBadge({ level, label, idle }: { level: Level; label?: string; idle?: boolean }) {
  const Icon = level === 3 ? CircleAlert : level === 2 ? TriangleAlert : level === 1 ? CircleCheck : CircleCheck;
  return (
    <span className={cx('badge', idle ? 'idle' : levelInfo[level].cls)}>
      <Icon size={13} />
      {label ?? levelInfo[level].label}
    </span>
  );
}

export function Panel({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <section className={cx('panel', className)} style={style}>{children}</section>;
}

export function PanelHead({ title, link, to }: { title: string; link?: string; to?: string }) {
  return (
    <div className="panel-head">
      <h3>{title}</h3>
      {link && to ? <Link to={to}>{link}</Link> : null}
    </div>
  );
}

export function Stat({ label, value, tone, note, on, onClick }: { label: string; value: string | number; Icon?: LucideIcon; tone?: 'critical' | 'warning' | 'neutral'; note?: string; on?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <span className="label">{label}</span>
      <span className="value">{value}{note ? <span className="note">{note}</span> : null}</span>
    </>
  );
  return onClick ? (
    <button type="button" className={cx('panel stat', tone, 'clickable', on && 'on')} aria-pressed={!!on} onClick={onClick}>{body}</button>
  ) : (
    <section className={cx('panel stat', tone)}>{body}</section>
  );
}

/** Page title block from the Figma screens: big title, one-line subtitle, actions on the right. */
export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="page-title">
      <div className="grow">
        <h2>{title}</h2>
        {sub ? <p className="muted">{sub}</p> : null}
      </div>
      {children ? <div className="actions">{children}</div> : null}
    </div>
  );
}

/** A filter that looks like a chip but opens a list (like "All levels" in the Figma Events screen). */
export function ChipSelect<T extends string>({ label, value, options, onChange, allLabel }: { label: string; value: T | ''; options: { value: T; label: string }[]; onChange: (v: T | '') => void; allLabel: string }) {
  return (
    <label className={cx('chip chip-select', value && 'on')}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T | '')}>
        <option value="">{allLabel}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

export function Banner({ children, Icon = CircleAlert, tone }: { children: ReactNode; Icon?: LucideIcon; tone?: 'critical' | 'warning' | 'insight' }) {
  return (
    <div className={cx('banner', tone)}>
      {tone === 'insight' ? null : <Icon size={18} />}
      <p>{children}</p>
    </div>
  );
}

export function Status({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="status" style={{ margin: 0 }}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ListRow({ to, title, sub, badge, right }: { to: string; title: string; sub?: string; badge?: ReactNode; right?: ReactNode }) {
  return (
    <Link to={to} className="list-row">
      <div className="lr-body">
        {badge}
        <span className="lr-title">{title}</span>
        {sub ? <span className="caption">{sub}</span> : null}
      </div>
      {right}
      <ChevronRight size={20} className="chev" />
    </Link>
  );
}

export function Bars({ values, labels, hot = [] }: { values: readonly number[]; labels?: readonly string[]; hot?: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="bars" role="img" aria-label={labels ? labels.map((l, i) => `${l}: ${values[i]}`).join(', ') : values.join(', ')}>
        {values.map((v, i) => (
          <div key={i} data-v={v} className={hot.includes(i) ? 'hot' : undefined} style={{ height: `${Math.max(3, (v / max) * 100)}%` }} />
        ))}
      </div>
      {labels ? (
        <div className="bar-labels">
          {labels.map((l) => <span key={l}>{l}</span>)}
        </div>
      ) : null}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={cx('toggle', on && 'on')} onClick={() => onChange(!on)} />;
}

export function Field({ label, value, onChange, type = 'text', small, placeholder, error, inputMode, autoComplete, hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; small?: boolean; placeholder?: string; error?: string | null; inputMode?: 'numeric' | 'email'; autoComplete?: string; hint?: string }) {
  const id = 'f-' + label.replace(/\W+/g, '-').toLowerCase();
  return (
    <div className={cx('field', small && 'small', error && 'invalid')}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} inputMode={inputMode} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? id + '-err' : undefined} />
      {error ? <span className="error" id={id + '-err'}>{error}</span> : hint ? <span className="caption">{hint}</span> : null}
    </div>
  );
}

// Data table on wide screens; becomes a list of cards on phones (render with `card`).
export function DataTable<T>({ cols, rows, onRow, cell, card, label, title }: { cols: string[]; rows: T[]; onRow?: (r: T) => void; cell: (r: T) => ReactNode[]; card: (r: T) => ReactNode; label: string; title?: string }) {
  return (
    <Panel className="tables-as-cards" style={{ padding: '0 0 0 0', gap: 0 }}>
      {title ? <h3 className="table-title">{title}</h3> : null}
      <div className="table-wrap">
        <table aria-label={label}>
          <thead>
            <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={onRow ? 'clickable' : undefined}
                onClick={onRow ? () => onRow(r) : undefined}
                tabIndex={onRow ? 0 : undefined}
                onKeyDown={onRow ? (e) => { if (e.key === 'Enter') onRow(r); } : undefined}
              >
                {cell(r).map((c, j) => <td key={j} className={j === 1 ? 'strong' : undefined}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mcards table-pad">
        {rows.map((r, i) => (
          <div key={i} className="mcard" role={onRow ? 'button' : undefined} tabIndex={onRow ? 0 : undefined} onClick={onRow ? () => onRow(r) : undefined}>
            {card(r)}
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---------- Clip player (placeholder footage; no real clips in this demo) ----------
export function ClipPlayer({ stamp }: { stamp: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(10);
  const seek = (d: number) => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.min(Math.max(0, v.currentTime + d), v.duration || 10);
  };
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="clip">
        <video
          ref={ref}
          src={clipSrc}
          muted
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 10)}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        />
        <span className="stamp">{stamp} · {t.toFixed(1)} s / {dur.toFixed(0)} s</span>
        <div className="progress"><div style={{ width: `${(t / dur) * 100}%` }} /></div>
      </div>
      <div className="chips">
        <Chip Icon={playing ? Pause : Play} onClick={() => { const v = ref.current; if (!v) return; if (v.paused) void v.play(); else v.pause(); }}>
          {playing ? 'Pause' : 'Play'}
        </Chip>
        <Chip Icon={SkipBack} onClick={() => seek(-1)}>Step back</Chip>
        <Chip Icon={SkipForward} onClick={() => seek(1)}>Step forward</Chip>
      </div>
    </div>
  );
}

// ---------- Confirm dialog ----------
export function ConfirmDialog({ title, body, confirm, danger, onConfirm, onCancel }: { title: string; body: string; confirm: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onCancel]);
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog plain" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p className="muted">{body}</p>
        <Button variant={danger ? 'danger' : 'primary'} block onClick={onConfirm}>{confirm}</Button>
        <Button variant="secondary" block onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export function callDriver(toast: (s: string, kind?: ToastKind) => void, name: string, phone: string) {
  // On a phone this opens the dialer; on a computer it just confirms.
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  else toast(`Calling ${name} at ${phone} (demo)`, 'info');
}
