// W04 Incident record
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Info } from 'lucide-react';
import { Banner, Button, Chip, ConfirmDialog, LevelBadge, Panel, Shell, callDriver, cx } from '../ui';
import { driverById } from '../data';
import { useApp } from '../state';
import type { ReactNode } from 'react';

const juan = driverById('juan')!;
const decisions = ['Replace driver', 'Stop trip', 'Delay delivery', 'Continue after rest'];
const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function Step({ title, n, time, closed, onToggle, children }: { title: string; n: number; time: string | null; closed: boolean; onToggle: () => void; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <button type="button" role="checkbox" aria-checked={!!time} aria-label={title} className={cx('check', !!time && 'on')} onClick={onToggle} disabled={closed}>
        {time ? <Check size={16} strokeWidth={3} /> : null}
      </button>
      <div className="stack" style={{ flex: 1, gap: 8 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <strong style={{ flex: 1, fontWeight: 500 }}>{n}. {title}</strong>
          {time ? <span className="muted">{time}</span> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Incident() {
  const { incident, setIncident, toast, run, reviewEvent } = useApp();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const done = Object.values(incident.steps).filter(Boolean).length;

  const toggle = (k: string) => {
    const t = incident.steps[k] ? null : now();
    setIncident({ steps: { ...incident.steps, [k]: t } });
    toast(t ? `Step marked done at ${t}` : 'Step marked not done', t ? 'success' : 'info');
  };
  const pick = (d: string) => {
    if (d === 'Replace driver' || d === 'Stop trip') setConfirm(d);
    else {
      setIncident({ decision: d });
      toast(`Trip decision: ${d}`);
    }
  };

  return (
    <Shell
      title="Incident"
      overlay={
        confirm ? (
          <ConfirmDialog
            title={`${confirm}?`}
            body={confirm === 'Replace driver' ? 'Ben Castillo (reliever) will be asked to take over Van 02. Juan Dela Cruz stops driving.' : 'The trip ends at the nearest safe place. Deliveries on this route are put on hold.'}
            confirm={confirm}
            danger
            onConfirm={() => { const c = confirm; setConfirm(null); run(c === 'Replace driver' ? 'Asking Ben Castillo to take over…' : 'Sending stop instruction to Van 02…', `Decision saved: ${c}`, () => setIncident({ decision: c })); }}
            onCancel={() => setConfirm(null)}
          />
        ) : confirmClose ? (
          <ConfirmDialog
            title="Close this incident?"
            body={`Decision: ${incident.decision}. Review: ${incident.review}. It will be saved to Reports.`}
            confirm="Close incident"
            onConfirm={() => {
              setConfirmClose(false);
              run('Saving incident…', 'Incident closed and saved to Reports', () => {
                setIncident({ closed: true });
                reviewEvent('e5', incident.review ?? 'Confirmed');
              });
            }}
            onCancel={() => setConfirmClose(false)}
          />
        ) : null
      }
    >
      <div className="page-head">
        <LevelBadge level={3} />
        <h2 className="grow">Incident · {incident.closed ? 'Closed' : 'Open'}</h2>
        <Button variant="danger" small onClick={() => callDriver(toast, juan.name, juan.phone)}>Call driver</Button>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>
        Juan Dela Cruz · Van 02 (NDE 5678) · Night shift · Nov 20, 2:47 AM · SLEX near Alabang, Muntinlupa
      </p>
      <div className="row">
        <Panel style={{ flex: 2, gap: 0 }}>
          <div className="panel-head"><h3>Steps</h3><span className="muted">{done} of 5 done</span></div>
          <Step n={1} title="Contacted driver" time={incident.steps.contacted} closed={incident.closed} onToggle={() => toggle('contacted')} />
          <Step n={2} title="Driver pulled over at a safe place" time={incident.steps.pulledOver} closed={incident.closed} onToggle={() => toggle('pulledOver')} />
          <Step n={3} title="Driver rested" time={incident.steps.rested} closed={incident.closed} onToggle={() => toggle('rested')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                aria-label="Minutes rested"
                inputMode="numeric"
                value={incident.rested}
                onChange={(e) => setIncident({ rested: e.target.value.replace(/\D/g, '') })}
                style={{ width: 72, height: 40, border: '1px solid var(--border)', borderRadius: 8, padding: '0 8px' }}
                disabled={incident.closed}
              />
              <span className="caption">Minutes: suggested 15 to 20</span>
            </div>
          </Step>
          <Step n={4} title="Dispatcher asked to monitor the driver" time={incident.steps.dispatcher} closed={incident.closed} onToggle={() => toggle('dispatcher')} />
          <Step n={5} title="Driver condition checked" time={incident.steps.checked} closed={incident.closed} onToggle={() => toggle('checked')}>
            <input
              aria-label="Short note"
              placeholder="Short note"
              value={incident.note}
              onChange={(e) => setIncident({ note: e.target.value })}
              style={{ height: 40, border: '1px solid var(--border)', borderRadius: 8, padding: '0 16px' }}
              disabled={incident.closed}
            />
          </Step>
          <div className="stack" style={{ paddingTop: 16 }}>
            <strong style={{ fontWeight: 500 }}>6. Trip decision</strong>
            <div className="chips">
              {decisions.map((d) => (
                <Chip key={d} on={incident.decision === d} onClick={incident.closed ? undefined : () => pick(d)}>{d}</Chip>
              ))}
            </div>
            <p className="caption">Replace and Stop come first after a 2nd Level 3, and ask for confirmation. Reliever available: Ben Castillo.</p>
          </div>
        </Panel>
        <div className="stack" style={{ gap: 24 }}>
          <Panel>
            <h3>Review result</h3>
            <div className="chips">
              {(['Confirmed', 'False alarm'] as const).map((r) => (
                <Chip key={r} on={incident.review === r} onClick={incident.closed ? undefined : () => { setIncident({ review: r }); toast(`Review: ${r}`); }}>{r}</Chip>
              ))}
            </div>
            <div className="field">
              <label htmlFor="inc-expl">Driver's explanation</label>
              <textarea id="inc-expl" rows={3} placeholder="What the driver said, e.g. slept 4 hours before the shift" value={incident.explanation} onChange={(e) => setIncident({ explanation: e.target.value })} disabled={incident.closed} />
            </div>
            <div className="field">
              <label htmlFor="inc-sup">Supervisor notes</label>
              <textarea id="inc-sup" rows={3} placeholder="Notes for the safety officer" value={incident.supervisor} onChange={(e) => setIncident({ supervisor: e.target.value })} disabled={incident.closed} />
            </div>
            {incident.closed ? (
              <Banner>Closed. Saved to Reports.</Banner>
            ) : (
              <>
                <Button block disabled={!incident.decision || !incident.review} onClick={() => setConfirmClose(true)}>Close incident</Button>
                <Button block variant="secondary" onClick={() => { toast('Incident kept open. Your changes are saved.', 'info'); navigate('/overview'); }}>Cancel</Button>
                {!incident.decision || !incident.review ? <p className="caption">Choose a trip decision and a review result to close.</p> : null}
              </>
            )}
          </Panel>
          <Banner Icon={Info}>Aizu is for fatigue prevention and road safety, not disciplinary action.</Banner>
        </div>
      </div>
    </Shell>
  );
}
