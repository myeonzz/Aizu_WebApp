// W07 Events
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Chip, ChipSelect, DataTable, LevelBadge, PageHead, Shell } from '../ui';
import { driverById, levelInfo } from '../data';
import type { Level } from '../data';
import { useApp } from '../state';

export default function Events() {
  const { events } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [level, setLevel] = useState<'' | '1' | '2' | '3'>('');
  const [vehicle, setVehicle] = useState('');
  const [shift, setShift] = useState<'' | 'Day' | 'Night'>('');
  const [unreviewed, setUnreviewed] = useState(params.get('unreviewed') === '1');
  const [todayOnly, setTodayOnly] = useState(false);
  const [more, setMore] = useState(false);
  const [withClip, setWithClip] = useState(false);
  const [driver, setDriver] = useState('');

  const list = events.filter(
    (e) =>
      (level ? e.level === (Number(level) as Level) : true) &&
      (vehicle ? driverById(e.driverId)!.vehicle === vehicle : true) &&
      (shift ? driverById(e.driverId)!.shift === shift : true) &&
      (unreviewed ? e.review === 'Not reviewed' : true) &&
      (todayOnly ? e.day === 'TODAY' : true) &&
      (withClip ? e.clip : true) &&
      (driver ? e.driverId === driver : true)
  );
  const driverIds = [...new Set(events.map((e) => e.driverId))];
  const vehicleNames = [...new Set(driverIds.map((id) => driverById(id)!.vehicle))];
  const extra = (unreviewed ? 1 : 0) + (withClip ? 1 : 0);
  const clearAll = () => { setLevel(''); setVehicle(''); setShift(''); setDriver(''); setUnreviewed(false); setWithClip(false); setTodayOnly(false); };

  return (
    <Shell title="Events">
      <PageHead title="Events" sub="Review alert history and device evidence." />
      <div className="chips">
        <Chip on onClick={() => setTodayOnly(!todayOnly)}>{todayOnly ? 'Today' : 'Last 7 days'}</Chip>
        <ChipSelect label="Level" value={level} onChange={setLevel} allLabel="All levels" options={([3, 2, 1] as Level[]).map((l) => ({ value: String(l) as '1' | '2' | '3', label: levelInfo[l].label }))} />
        <ChipSelect label="Driver" value={driver} onChange={setDriver} allLabel="Driver" options={driverIds.map((id) => ({ value: id, label: driverById(id)!.name }))} />
        <ChipSelect label="Vehicle" value={vehicle} onChange={setVehicle} allLabel="Vehicle" options={vehicleNames.map((v) => ({ value: v, label: v }))} />
        <ChipSelect label="Shift" value={shift} onChange={setShift} allLabel="Shift" options={[{ value: 'Day', label: 'Day shift' }, { value: 'Night', label: 'Night shift' }]} />
        <Chip on={more || extra > 0} onClick={() => setMore(!more)}>{extra ? `More filters (${extra})` : 'More filters'}</Chip>
        {level || driver || vehicle || shift || extra || todayOnly ? <button type="button" className="text-link" onClick={clearAll}>Clear filters</button> : null}
      </div>
      {more ? (
        <div className="chips">
          <Chip on={unreviewed} onClick={() => setUnreviewed(!unreviewed)}>Not reviewed</Chip>
          <Chip on={withClip} onClick={() => setWithClip(!withClip)}>Has clip</Chip>
        </div>
      ) : null}
      {!list.length ? <p className="muted">No events match these filters.</p> : null}
      {(['TODAY', 'YESTERDAY'] as const).map((day) => {
        const rows = list.filter((e) => e.day === day);
        if (!rows.length) return null;
        return (
          <div key={day} className="stack">
            <span className="section-label">{day}</span>
            <DataTable
              label={`Events ${day.toLowerCase()}`}
              cols={['Time', 'Level', 'Driver', 'Vehicle', 'Behavior', 'Location', 'Clip', 'Review']}
              rows={rows}
              onRow={(e) => navigate(`/events/${e.id}`)}
              cell={(e) => {
                const d = driverById(e.driverId)!;
                return [
                  e.time,
                  <LevelBadge level={e.level} />,
                  d.name,
                  d.vehicle,
                  e.behavior,
                  <span className={e.location === 'Location unavailable' ? 'muted' : undefined}>{e.location}</span>,
                  e.clip ? 'Yes' : 'No clip',
                  <span className={e.review === '—' ? 'muted' : 'review-link'}>{e.review}</span>,
                ];
              }}
              card={(e) => (
                <>
                  <div className="top">
                    <span className="name">{driverById(e.driverId)!.name}</span>
                    <LevelBadge level={e.level} />
                  </div>
                  <span>{e.time} · {e.behavior}</span>
                  <span className="caption">{e.location} · {e.clip ? 'Clip' : 'No clip'} · <span className={`review-${e.review}`}>{e.review}</span></span>
                </>
              )}
            />
          </div>
        );
      })}
    </Shell>
  );
}
