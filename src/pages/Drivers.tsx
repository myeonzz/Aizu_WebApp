// W05 Drivers
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Banner, Chip, DataTable, PageHead, Shell } from '../ui';
import { useApp } from '../state';
import { drivers } from '../data';
import type { FleetDriver } from '../data';

const trend = (d: FleetDriver) => (d.weekTrend ? `${d.week} (${d.weekTrend})` : String(d.week));
const trendColor = (d: FleetDriver) => (d.weekTrend?.startsWith('up') ? 'var(--critical)' : d.weekTrend?.startsWith('down') ? 'var(--ok)' : undefined);

export default function Drivers() {
  const navigate = useNavigate();
  const { toast } = useApp();
  const [shift, setShift] = useState<'Day' | 'Night' | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [byOffenses, setByOffenses] = useState(true);
  const list = [...drivers]
    .filter((d) => d.route !== 'Reliever' && d.week > 0)
    .filter((d) => (shift ? d.shift === shift : true))
    .filter((d) => (kind ? d.vehicle.startsWith(kind) : true))
    .sort((a, b) => (byOffenses ? b.week - a.week : a.name.localeCompare(b.name)));

  return (
    <Shell title="Drivers">
      <PageHead title="Drivers" sub="Find patterns, then change the schedule." />
      <div className="chips">
        <Chip on onClick={() => { setByOffenses(!byOffenses); toast(byOffenses ? 'Sorted by name' : 'Sorted by most offenses this week', 'info'); }}>{byOffenses ? 'Most offenses this week' : 'Sorted by name'}</Chip>
        <Chip on={shift === 'Day'} onClick={() => setShift(shift === 'Day' ? null : 'Day')}>Day shift</Chip>
        <Chip on={shift === 'Night'} onClick={() => setShift(shift === 'Night' ? null : 'Night')}>Night shift</Chip>
        {['Van', 'Truck', 'SUV'].map((k) => (
          <Chip key={k} on={kind === k} onClick={() => setKind(kind === k ? null : k)}>{k}</Chip>
        ))}
      </div>
      {list.length ? (
        <DataTable
          label="Drivers"
          cols={['Driver', 'Vehicle', 'Shift', 'Offenses this week', 'Level 3 this month', 'False alarms this month']}
          rows={list}
          onRow={(d) => navigate(`/drivers/${d.id}`)}
          cell={(d) => [d.name, `${d.vehicle} · ${d.plate}`, d.shift, <span style={{ color: trendColor(d) }}>{trend(d)}</span>, d.l3Month, d.falseMonth]}
          card={(d) => (
            <>
              <div className="top"><span className="name">{d.name}</span><strong style={{ color: trendColor(d) }}>{trend(d)}</strong></div>
              <span className="caption">{d.vehicle} · {d.shift} shift · {d.l3Month} Level 3 · {d.falseMonth} false alarms this month</span>
            </>
          )}
        />
      ) : (
        <p className="muted">No drivers with offenses match these filters.</p>
      )}
      <Banner Icon={Info} tone="insight">Night shift has about 3 times as many offenses as day shift this week.</Banner>
    </Shell>
  );
}
