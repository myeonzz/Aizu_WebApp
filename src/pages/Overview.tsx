// W02 Fleet overview, with W03 Critical alert pop-up. On phones this is the M01 layout.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, TriangleAlert } from 'lucide-react';
import { Banner, Button, Chip, DataTable, LevelBadge, ListRow, Panel, PanelHead, Shell, Stat, Status, callDriver } from '../ui';
import { driverById, drivers, levelInfo } from '../data';
import type { FleetDriver } from '../data';
import { useApp } from '../state';

const juan = driverById('juan')!;

export default function Overview() {
  const { acknowledged, acknowledge, events, toast, incident } = useApp();
  const navigate = useNavigate();
  const [onTripOnly, setOnTripOnly] = useState(true);
  const [popup, setPopup] = useState(false);

  useEffect(() => {
    if (acknowledged) return;
    const t = setTimeout(() => setPopup(true), 1500);
    return () => clearTimeout(t);
  }, [acknowledged]);

  const list = drivers.filter((d) => (onTripOnly ? d.onTrip : true));
  const latest = events.slice(0, 3);
  const top = [...drivers].sort((a, b) => b.week - a.week).slice(0, 3);
  const unreviewed = events.filter((e) => e.review === 'Not reviewed').length;
  const late = drivers.filter((d) => d.late).length;

  const close = () => {
    acknowledge();
    setPopup(false);
    toast('Alert acknowledged. It stays in Events for review.');
  };
  const openIncident = () => {
    acknowledge();
    setPopup(false);
    toast('Incident record opened', 'info');
    navigate('/incident');
  };

  const overlay =
    popup && !acknowledged ? (
      <div className="overlay">
        <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="crit-title">
          <div className="chips" style={{ alignItems: 'center' }}>
            <LevelBadge level={3} />
            <span id="crit-title" className="section-label" style={{ color: 'var(--critical)' }}>CRITICAL ALERT · 2:47 AM</span>
          </div>
          <Status
            rows={[
              ['Driver', 'Juan Dela Cruz · Night shift'],
              ['Vehicle', 'Van 02 · NDE 5678'],
              ['What happened', 'Eyes closed 3.4 s'],
              ['Where', 'SLEX near Alabang, Muntinlupa'],
              ['Offenses in last 10 min', <span style={{ color: 'var(--critical)' }}>3</span>],
            ]}
          />
          <Banner Icon={TriangleAlert} tone="critical">
            2nd Level 3 this trip (first at 1:58 AM). Consider replacing the driver or stopping the trip.
          </Banner>
          <Button variant="danger" block onClick={() => callDriver(toast, juan.name, juan.phone)}>Call driver</Button>
          <Button variant="secondary" block onClick={openIncident}>Open incident</Button>
          <Button variant="ghost" block onClick={close}>Acknowledge</Button>
        </div>
      </div>
    ) : null;

  const levelLabel = (d: FleetDriver) => (d.level === 0 ? (d.onTrip ? levelInfo[0].label : 'Parked') : levelInfo[d.level].label);

  return (
    <Shell title="Overview" overlay={overlay}>
      {!incident.closed ? (
        <div className="attention" role="alert">
          <CircleAlert size={20} />
          <p>Juan Dela Cruz · Van 02 (NDE 5678) is at L3 Critical (2:47 AM) · 2nd Level 3 this trip</p>
          <Button variant="danger" onClick={() => callDriver(toast, juan.name, juan.phone)}>Call driver</Button>
          <Button variant="secondary" onClick={openIncident}>Open incident</Button>
        </div>
      ) : (
        <Banner>The Level 3 incident for Juan Dela Cruz is closed. Decision: {incident.decision}.</Banner>
      )}

      <div className="chips">
        <Chip on={onTripOnly} onClick={() => { setOnTripOnly(true); toast(`Showing ${drivers.filter((d) => d.onTrip).length} vehicles on trip`, 'info'); }}>On trip ({drivers.filter((d) => d.onTrip).length})</Chip>
        <Chip on={!onTripOnly} onClick={() => { setOnTripOnly(false); toast(`Showing all ${drivers.length} vehicles`, 'info'); }}>All vehicles ({drivers.length})</Chip>
      </div>

      <DataTable
        label="Vehicles"
        cols={['Level', 'Driver', 'Vehicle', 'Shift', 'Route', 'Offenses this shift', 'Last synced']}
        rows={list}
        onRow={(d) => navigate(`/drivers/${d.id}`)}
        cell={(d) => [
          <LevelBadge level={d.level} label={levelLabel(d)} idle={!d.onTrip} />,
          d.name,
          `${d.vehicle} · ${d.plate}`,
          d.shift,
          d.route,
          d.offensesShift,
          <span className={d.late ? 'late' : undefined}>{d.synced}</span>,
        ]}
        card={(d) => (
          <>
            <div className="top">
              <span className="name">{d.name}</span>
              <LevelBadge level={d.level} label={levelLabel(d)} idle={!d.onTrip} />
            </div>
            <span className="caption">{d.vehicle} · {d.route} · {d.offensesShift} offenses this shift</span>
            <span className={d.late ? 'caption late' : 'caption'}>Synced {d.synced}</span>
          </>
        )}
      />

      <div className="stats">
        <Stat label="Alerts this shift" value={events.filter((e) => e.day === 'TODAY').length} />
        <Stat label="Critical this shift" value={events.filter((e) => e.day === 'TODAY' && e.level === 3).length} tone="critical" />
        <Stat label="Vehicles offline or late" value={late} tone="warning" />
      </div>

      <div className="row">
        <Panel>
          <PanelHead title={`Latest alerts${unreviewed ? ` · ${unreviewed} not reviewed` : ''}`} link="See all events" to="/events" />
          <div>
            {latest.map((e) => (
              <ListRow
                key={e.id}
                to={`/events/${e.id}`}
                right={<LevelBadge level={e.level} />}
                title={`${e.time} · ${driverById(e.driverId)!.name}`}
                sub={`${e.behavior} · ${e.location.split(',')[0]} · ${e.review}`}
              />
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHead title="Most offenses this week" link="See all drivers" to="/drivers" />
          <div>
            {top.map((d) => (
              <ListRow key={d.id} to={`/drivers/${d.id}`} title={d.name} sub={`${d.shift} · ${d.vehicle}`} right={<span style={{ fontWeight: 500, color: d.weekTrend?.startsWith('up') ? 'var(--critical)' : d.weekTrend?.startsWith('down') ? 'var(--ok)' : undefined }}>{d.weekTrend ? `${d.week} (${d.weekTrend})` : d.week}</span>} />
            ))}
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
