// Vehicles tab (from the Figma prototype): status cards, a vehicle table and Add vehicle.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button, DataTable, Field, LevelBadge, PageHead, Shell, Stat, cx } from '../ui';
import { driverById, drivers } from '../data';
import type { Vehicle } from '../data';
import { useApp } from '../state';

type Filter = 'all' | 'trip' | 'parked' | 'late';

function StatusBadge({ v }: { v: Vehicle }) {
  const d = v.driverId ? driverById(v.driverId) : null;
  if (v.status === 'On trip' && d) return <LevelBadge level={d.level} />;
  return <span className={cx('badge', 'idle')}>{v.status}</span>;
}

const empty = { name: '', type: 'Van' as Vehicle['type'], plate: '', driverId: '', route: '' };

export default function Vehicles() {
  const { vehicles, addVehicle, run, toast } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [panel, setPanel] = useState(false);
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState<Partial<Record<'name' | 'plate', string>>>({});

  useEffect(() => {
    if (!panel) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [panel]);

  const onTrip = vehicles.filter((v) => v.status === 'On trip');
  const parked = vehicles.filter((v) => v.status === 'Parked');
  const late = vehicles.filter((v) => v.late);
  const list = filter === 'trip' ? onTrip : filter === 'parked' ? parked : filter === 'late' ? late : vehicles;
  const pick = (f: Filter) => setFilter(filter === f ? 'all' : f);
  const assigned = new Set(vehicles.map((v) => v.driverId));

  const save = () => {
    const x: typeof err = {};
    if (!form.name.trim()) x.name = 'Enter a vehicle name, like Van 05.';
    else if (vehicles.some((v) => v.name.toLowerCase() === form.name.trim().toLowerCase())) x.name = 'A vehicle with this name already exists.';
    if (!/^[A-Z]{3}\s?\d{3,4}$/i.test(form.plate.trim())) x.plate = 'Use a plate like NDE 5678.';
    setErr(x);
    if (Object.keys(x).length) return;
    const v: Vehicle = {
      id: 'v' + Date.now(),
      name: form.name.trim(),
      type: form.type,
      plate: form.plate.trim().toUpperCase().replace(/^([A-Z]{3})\s?/, '$1 '),
      driverId: form.driverId || null,
      status: 'Parked',
      route: form.route.trim() || 'Depot, Imus',
      synced: 'Waiting for device',
      device: 'Not paired',
    };
    setPanel(false);
    run('Adding vehicle…', `${v.name} added. Pair its Aizu device from the driver app.`, () => addVehicle(v));
  };

  const overlay = panel ? (
    <div className="side-overlay" role="dialog" aria-modal="true" aria-label="Add vehicle">
      <div className="dim" onClick={() => setPanel(false)} />
      <div className="side-panel">
        <div className="panel-head">
          <h2 style={{ flex: 1 }}>Add vehicle</h2>
          <button className="icon-btn" aria-label="Close" onClick={() => setPanel(false)}><X size={20} /></button>
        </div>
        <p className="muted">The vehicle shows as parked until its Aizu device is paired.</p>
        <Field label="Vehicle name" value={form.name} onChange={(v) => { setForm({ ...form, name: v }); setErr({ ...err, name: undefined }); }} placeholder="e.g. Van 05" error={err.name} />
        <div className="field">
          <label htmlFor="v-type">Type</label>
          <select id="v-type" className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Vehicle['type'] })}>
            <option>Van</option>
            <option>Truck</option>
            <option>SUV</option>
          </select>
        </div>
        <Field label="Plate number" value={form.plate} onChange={(v) => { setForm({ ...form, plate: v }); setErr({ ...err, plate: undefined }); }} placeholder="e.g. NDE 5678" error={err.plate} />
        <div className="field">
          <label htmlFor="v-driver">Assigned driver</label>
          <select id="v-driver" className="select" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
            <option value="">Unassigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}{assigned.has(d.id) ? ' (has a vehicle)' : ''}</option>
            ))}
          </select>
        </div>
        <Field label="Usual route (optional)" value={form.route} onChange={(v) => setForm({ ...form, route: v })} placeholder="e.g. Imus – Laguna" />
        <div className="spacer" />
        <Button block onClick={save}>Add vehicle</Button>
        <Button block variant="secondary" onClick={() => setPanel(false)}>Cancel</Button>
      </div>
    </div>
  ) : null;

  return (
    <Shell title="Vehicles" overlay={overlay}>
      <PageHead title="Vehicles" sub="Current status across the fleet.">
        <Button onClick={() => { setForm(empty); setErr({}); setPanel(true); }}>Add vehicle</Button>
      </PageHead>
      <div className="stats">
        <Stat label="On trip" value={onTrip.length} on={filter === 'trip'} onClick={() => pick('trip')} />
        <Stat label="Parked" value={parked.length} on={filter === 'parked'} onClick={() => pick('parked')} />
        <Stat label="Offline or late" value={late.length} tone="warning" on={filter === 'late'} onClick={() => pick('late')} />
      </div>
      {filter !== 'all' ? (
        <div className="chips">
          <span className="muted">Showing {list.length} of {vehicles.length} vehicles.</span>
          <button type="button" className="text-link" onClick={() => setFilter('all')}>Show all</button>
        </div>
      ) : null}
      <DataTable
        label="Vehicles"
        cols={['Vehicle', 'Assigned driver', 'Status', 'Route', 'Last synced']}
        rows={list}
        onRow={(v) => (v.driverId ? navigate(`/drivers/${v.driverId}`) : toast(`${v.name} has no driver yet. Assign one from Drivers.`, 'info'))}
        cell={(v) => [
          `${v.name} · ${v.plate}`,
          v.driverId ? driverById(v.driverId)?.name : <span className="muted">Unassigned</span>,
          <StatusBadge v={v} />,
          v.route,
          <span className={v.late ? 'late' : undefined}>{v.synced}</span>,
        ]}
        card={(v) => (
          <>
            <div className="top"><span className="name">{v.name} · {v.plate}</span><StatusBadge v={v} /></div>
            <span className="caption">{v.driverId ? driverById(v.driverId)?.name : 'Unassigned'} · {v.route}</span>
            <span className={cx('caption', v.late && 'late')}>Synced {v.synced}</span>
          </>
        )}
      />
    </Shell>
  );
}
