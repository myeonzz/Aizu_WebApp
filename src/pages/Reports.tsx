// W09 Reports
import { useState } from 'react';
import { Bars, Button, Chip, ChipSelect, DataTable, PageHead, Panel, Shell, Stat } from '../ui';
import { drivers, reportRanges } from '../data';
import type { ReportRange } from '../data';
import { useApp } from '../state';

const names = drivers.map((d) => d.name.split(' ')[0]);

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { incident, run, name } = useApp();
  const [range, setRange] = useState<ReportRange>('This week');
  const [shift, setShift] = useState<'All' | 'Day' | 'Night'>('All');
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [driver, setDriver] = useState('');
  const r = reportRanges[range];
  const total = (r.per as readonly number[]).reduce((a, b) => a + b, 0) || 1;
  const di = drivers.findIndex((d) => d.id === driver);
  const kd = di >= 0 ? (r.per[di] ?? 0) / total : 1;
  const ks = shift === 'All' ? 1 : shift === 'Night' ? 0.75 : 0.25;
  const n = (v: number) => Math.round(v * ks * kd);

  const incidents = [
    { when: 'Nov 20, 2:47 AM', driver: 'Juan Dela Cruz', by: name, outcome: incident.closed ? `${incident.decision} (${incident.review})` : 'Open' },
    { when: 'Nov 20, 1:58 AM', driver: 'Juan Dela Cruz', by: 'Leonard P.', outcome: 'Rested 15 min, continued' },
  ];

  const exportCsv = () => {
    const lines = [
      `Aizu fleet report,${custom && from && to ? `${from} to ${to}` : range},${shift} shifts,${di >= 0 ? drivers[di].name : 'All drivers'}`,
      'Level,Count',
      `L1 Caution,${n(r.l1)}`, `L2 Warning,${n(r.l2)}`, `L3 Critical,${n(r.l3)}`, `False alarms,${n(r.fa)}`,
      '',
      'Driver,Offenses',
      ...names.map((x, i) => `${x},${n(r.per[i] ?? 0)}`),
      '',
      'Level 3 incident,Driver,Handled by,Outcome',
      ...incidents.map((i) => `${i.when},${i.driver},${i.by},${i.outcome}`),
    ];
    run('Preparing CSV…', 'CSV downloaded', () => download(`aizu-report-${range.toLowerCase().replace(/\s/g, '-')}.csv`, lines.join('\n'), 'text/csv'));
  };

  return (
    <Shell title="Reports">
      <PageHead title="Reports" sub="Share trends and critical incident outcomes.">
        <Button variant="secondary" onClick={() => run('Preparing PDF…', 'Print view ready. Choose "Save as PDF".', () => setTimeout(() => window.print(), 300))}>Export PDF</Button>
        <Button onClick={exportCsv}>Export CSV</Button>
      </PageHead>
      <div className="chips">
        <Chip on={range === 'This week'} onClick={() => { setRange('This week'); setCustom(false); }}>This week</Chip>
        <Chip on={range === 'This month'} onClick={() => { setRange('This month'); setCustom(false); }}>This month</Chip>
        <Chip on={custom} onClick={() => { setCustom(true); setRange('Last 3 months'); }}>{custom && from && to ? `${from} to ${to}` : 'Custom'}</Chip>
        <ChipSelect label="Driver" value={driver} onChange={setDriver} allLabel="All drivers" options={drivers.filter((d) => d.week > 0).map((d) => ({ value: d.id, label: d.name }))} />
        <ChipSelect label="Shift" value={shift === 'All' ? '' : shift} onChange={(v) => setShift(v || 'All')} allLabel="Day or night shift" options={[{ value: 'Day', label: 'Day shift' }, { value: 'Night', label: 'Night shift' }]} />
      </div>
      {custom ? (
        <div className="chips">
          <label className="date-field">From <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="date-field">To <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
          <span className="caption">Demo data uses the last 3 months for any custom range.</span>
        </div>
      ) : null}
      <div className="stats">
        <Stat label="L1 Caution" value={n(r.l1)} />
        <Stat label="L2 Warning" value={n(r.l2)} tone="warning" />
        <Stat label="L3 Critical" value={n(r.l3)} tone="critical" />
        <Stat label="False alarms" value={n(r.fa)} />
      </div>
      <div className="row stretch">
        <Panel>
          <h3>Offenses per driver</h3>
          <Bars values={r.per.map((v, i) => (di >= 0 && i !== di ? 0 : Math.round(v * ks)))} labels={names} hot={di >= 0 ? [di] : []} />
        </Panel>
        <Panel>
          <h3>Day vs night shift</h3>
          <Bars values={[r.dn[0], r.dn[1]].map(n)} labels={['Day', 'Night']} />
        </Panel>
      </div>
      <DataTable
        label="Level 3 incidents"
        title="Level 3 incidents"
        cols={['Incident', 'Driver', 'Handled by', 'Outcome']}
        rows={incidents}
        cell={(i) => [i.when, i.driver, i.by, <span style={i.outcome === 'Open' ? { color: 'var(--warning)', fontWeight: 500 } : undefined}>{i.outcome}</span>]}
        card={(i) => (
          <>
            <div className="top"><span className="name">{i.driver}</span><span style={i.outcome === 'Open' ? { color: 'var(--warning)', fontWeight: 500 } : undefined}>{i.outcome}</span></div>
            <span className="caption">{i.when} · handled by {i.by}</span>
          </>
        )}
      />
    </Shell>
  );
}
