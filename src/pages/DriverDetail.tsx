// W06 Driver detail and schedule (the side panel opens from "Adjust schedule")
import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, BellRing, EyeOff, OctagonAlert, X } from 'lucide-react';
import { Bars, Button, Field, LevelBadge, ListRow, Panel, Shell, Stat, Toggle, callDriver } from '../ui';
import { driverById, drivers, levelInfo } from '../data';
import { scheduleFor, useApp } from '../state';
import type { Schedule } from '../state';

const hourLabels = ['6P', '8P', '10P', '12A', '1A', '2A', '3A', '4A', '5A', '6A', '12P', '4P'];
// Deterministic sample series per driver
const series = (seed: number, n: number, scale: number) => Array.from({ length: n }, (_, i) => Math.round(((Math.sin(seed * 7 + i * 1.7) + 1) / 2) * scale));

export default function DriverDetail() {
  const { id } = useParams();
  const { schedules, setSchedule, toast, run, events } = useApp();
  const d = driverById(id ?? '');
  const [panel, setPanel] = useState(false);
  const [draft, setDraft] = useState<Schedule | null>(null);
  const [minErr, setMinErr] = useState<string | null>(null);

  useEffect(() => {
    if (!panel) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [panel]);

  if (!d) return <Navigate to="/drivers" replace />;
  const idx = drivers.indexOf(d) + 1;
  const sched = scheduleFor(schedules, d.id);
  const perDay = series(idx, 30, Math.max(1, d.week));
  const byHour = d.shift === 'Night' ? [1, 1, 2, 5, 7, 8, 6, 3, 1, 0, 0, 0].map((v) => Math.round((v * d.week) / 9)) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1].map((v) => v * d.week);
  const mine = events.filter((e) => e.driverId === d.id);
  const reliever = drivers.find((x) => x.route === 'Reliever')!;

  const summary = `${sched.dayShift ? 'Day shift, 6 AM to 6 PM' : d.shift === 'Night' ? 'Night shift, 6 PM to 6 AM' : 'Day shift, 6 AM to 6 PM'} · ${sched.rest ? `${sched.minutes}-minute break every 2 hours` : 'no set breaks'} · ${sched.reliever ? `reliever: ${reliever.name}` : 'no reliever'}${d.id === 'juan' && !schedules[d.id] ? ' · longest recent shift 13.5 h' : ''}`;

  const open = () => {
    setDraft({ ...sched });
    setMinErr(null);
    setPanel(true);
  };
  const save = () => {
    if (!draft) return;
    if (draft.rest && (draft.minutes < 10 || draft.minutes > 60)) return setMinErr('Use 10 to 60 minutes. Suggested 15 to 20.');
    const next = draft;
    setPanel(false);
    run('Saving schedule…', `Saved. ${d.name} will see the new schedule in the Aizu app`, () => setSchedule(d.id, next));
  };

  const overlay =
    panel && draft ? (
      <div className="side-overlay">
        <div className="dim" onClick={() => setPanel(false)} />
        <aside className="side-panel" role="dialog" aria-modal="true" aria-label="Adjust schedule">
          <div className="panel-head">
            <h2 style={{ flex: 1 }}>Adjust schedule</h2>
            <button className="icon-btn" aria-label="Close" onClick={() => setPanel(false)}><X size={20} /></button>
          </div>
          <div className="toggle-row">
            <div><strong style={{ fontWeight: 500 }}>Rest break every 2 hours</strong><p className="caption">{draft.minutes} minutes</p></div>
            <Toggle label="Rest break every 2 hours" on={draft.rest} onChange={(v) => setDraft({ ...draft, rest: v })} />
          </div>
          {draft.rest ? (
            <Field label="Break length (minutes)" inputMode="numeric" value={String(draft.minutes || '')} onChange={(v) => { setDraft({ ...draft, minutes: Number(v.replace(/\D/g, '')) }); setMinErr(null); }} error={minErr} />
          ) : null}
          <div className="toggle-row">
            <div><strong style={{ fontWeight: 500 }}>Move to day shift</strong></div>
            <Toggle label="Move to day shift" on={draft.dayShift} onChange={(v) => setDraft({ ...draft, dayShift: v })} />
          </div>
          <div className="toggle-row">
            <div><strong style={{ fontWeight: 500 }}>Assign a reliever on long trips</strong><p className="caption">{reliever.name}</p></div>
            <Toggle label="Assign a reliever on long trips" on={draft.reliever} onChange={(v) => setDraft({ ...draft, reliever: v })} />
          </div>
          <div className="spacer" />
          <Button block onClick={save}>Save changes</Button>
          <Button block variant="secondary" onClick={() => setPanel(false)}>Cancel</Button>
        </aside>
      </div>
    ) : null;

  return (
    <Shell title="Driver" overlay={overlay}>
      <Link to="/drivers" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <ArrowLeft size={16} /> All drivers
      </Link>
      <div className="page-head">
        <div className="grow stack" style={{ gap: 4 }}>
          <div className="chips" style={{ alignItems: 'center' }}>
            <h1>{d.name}</h1>
            <LevelBadge level={d.level} label={d.level === 0 ? (d.onTrip ? 'OK' : 'Off shift') : levelInfo[d.level].label} idle={!d.onTrip} />
          </div>
          <p className="muted">{d.vehicle} · {d.plate} · {d.shift} shift · {d.route} · {d.phone}</p>
        </div>
        <Button variant="danger" onClick={() => callDriver(toast, d.name, d.phone)}>Call driver</Button>
      </div>
      <div className="stats">
        <Stat label="Offenses this week" value={d.week} note={d.weekTrend && d.weekTrend !== 'same' ? d.weekTrend : undefined} Icon={BellRing} />
        <Stat label="Level 3 this month" value={d.l3Month} Icon={OctagonAlert} tone="critical" />
        <Stat label="Most common behavior" value={d.week === 0 ? 'None' : d.id === 'juan' ? 'Eye closure 71%' : d.id === 'ramon' ? 'Yawn 60%' : 'Eye closure 55%'} Icon={EyeOff} tone="neutral" />
      </div>
      <div className="row stretch">
        <Panel>
          <h3>Offenses per day, last 30 days</h3>
          <Bars values={perDay} />
        </Panel>
        <Panel>
          <h3>Offenses by time of day</h3>
          <Bars values={byHour} labels={hourLabels} hot={d.shift === 'Night' ? [4, 5, 6] : []} />
        </Panel>
      </div>
      <Panel>
        <div className="page-head">
          <div className="grow stack" style={{ gap: 4 }}>
            <h3>Schedule and rest breaks</h3>
            <p className="muted">{summary}</p>
          </div>
          <Button variant="secondary" onClick={open}>Adjust schedule</Button>
        </div>
      </Panel>
      {mine.length ? (
        <Panel>
          <h3>Recent alerts</h3>
          <div>
            {mine.map((e) => (
              <ListRow key={e.id} to={`/events/${e.id}`} badge={<LevelBadge level={e.level} />} title={`${e.time} · ${e.behavior}`} sub={`${e.location} · ${e.review}`} />
            ))}
          </div>
        </Panel>
      ) : null}
    </Shell>
  );
}
