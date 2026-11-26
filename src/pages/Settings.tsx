// W10 Settings, laid out like the Figma prototype: a section list on the left, the section on the right.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Bluetooth, Database, FileText, Lock, Users, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Chip, DataTable, Field, PageHead, Panel, Shell, Toggle, cx } from '../ui';
import { roles } from '../data';
import { useApp } from '../state';

type Section = 'users' | 'clips' | 'retention' | 'notifications' | 'devices' | 'privacy';
const sections: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: 'users', label: 'Users and roles', Icon: Users },
  { id: 'clips', label: 'Clip access log', Icon: Lock },
  { id: 'retention', label: 'Data retention', Icon: Database },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'devices', label: 'Devices', Icon: Bluetooth },
  { id: 'privacy', label: 'Privacy notice', Icon: FileText },
];

const retentionOptions = ['30 days (default)', '60 days', '90 days'];

const seedUsers = [
  { name: 'Leonard P.', email: 'leonard@sampledelivery.ph', role: 'Fleet Manager' },
  { name: 'Ana Reyes', email: 'ana@sampledelivery.ph', role: 'Safety Officer' },
  { name: 'Joel Cruz', email: 'joel@sampledelivery.ph', role: 'Dispatcher' },
];

const clipLog = [
  { when: 'Nov 20, 3:05 AM', who: 'Leonard P.', role: 'Fleet Manager', clip: 'Juan Dela Cruz · 2:47 AM', why: 'Incident review' },
  { when: 'Nov 20, 2:10 AM', who: 'Ana Reyes', role: 'Safety Officer', clip: 'Juan Dela Cruz · 1:58 AM', why: 'Confirm drowsiness' },
  { when: 'Nov 20, 1:02 AM', who: 'Leonard P.', role: 'Fleet Manager', clip: 'Dennis Garcia · 12:40 AM', why: 'Marked false alarm' },
];

const devices = [
  { id: 'AIZU-1041', vehicle: 'Van 02', battery: '82%', status: 'Connected', fw: '1.4.2' },
  { id: 'AIZU-1042', vehicle: 'Truck 01', battery: '67%', status: 'Connected', fw: '1.4.2' },
  { id: 'AIZU-1043', vehicle: 'Truck 02', battery: '41%', status: 'Weak signal', fw: '1.4.1' },
  { id: 'AIZU-1044', vehicle: 'Van 04', battery: '90%', status: 'Connected', fw: '1.4.2' },
];

const notifRows = [
  ['l3push', 'Level 3 critical: push notification', 'Sent right away, even at night.'],
  ['l3sms', 'Level 3 critical: text message', 'Backup if the app is closed.'],
  ['l2push', 'Level 2 warning: push notification', 'Sent when a driver has 2 or more in 10 minutes.'],
  ['daily', 'Daily summary email', 'Sent at 7 AM.'],
  ['weekly', 'Weekly report email', 'Sent on Monday at 8 AM.'],
] as const;
type NotifKey = (typeof notifRows)[number][0];

function RetentionPanel() {
  const { retention, setRetention, run } = useApp();
  return (
    <Panel>
      <h3>Data retention</h3>
      <div className="chips" role="radiogroup" aria-label="Keep clips for">
        {retentionOptions.map((o) => (
          <Chip
            key={o}
            on={retention === o}
            onClick={() => {
              if (o === retention) return;
              setRetention(o);
              run('Updating retention…', `New clips will be kept for ${o.replace(' (default)', '')}`, undefined, 600);
            }}
          >
            {o}
          </Chip>
        ))}
      </div>
      <p className="caption">“Keep longer” is allowed only for a critical incident under investigation.</p>
    </Panel>
  );
}

export default function SettingsPage() {
  const { run, toast, retention } = useApp();
  const [params, setParams] = useSearchParams();
  const section = (sections.some((s) => s.id === params.get('s')) ? params.get('s') : 'users') as Section;
  const go = (s: Section) => setParams(s === 'users' ? {} : { s }, { replace: true });
  const [users, setUsers] = useState(seedUsers);
  const [adding, setAdding] = useState(false);
  const [nu, setNu] = useState({ name: '', email: '', role: 'Dispatcher' });
  const [nuErr, setNuErr] = useState<string | null>(null);
  const [notif, setNotif] = useState<Record<NotifKey, boolean>>({ l3push: true, l3sms: true, l2push: true, daily: false, weekly: true });

  const addUser = () => {
    if (nu.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nu.email.trim())) return setNuErr('Enter a name and a valid work email.');
    if (users.some((u) => u.email === nu.email.trim())) return setNuErr('This person already has access.');
    const u = { name: nu.name.trim(), email: nu.email.trim(), role: nu.role };
    setAdding(false);
    run('Sending invite…', `Invite sent to ${u.email}`, () => setUsers((p) => [...p, u]));
  };
  const setN = (k: NotifKey, v: boolean, label: string) => {
    setNotif({ ...notif, [k]: v });
    toast(`${label}: ${v ? 'on' : 'off'}`, 'info');
  };
  const role = roles.find((r) => r.role === nu.role);

  const overlay = adding ? (
    <div className="side-overlay" role="dialog" aria-modal="true" aria-label="Add user">
      <div className="dim" onClick={() => setAdding(false)} />
      <div className="side-panel">
        <div className="panel-head">
          <h2 style={{ flex: 1 }}>Add user</h2>
          <button className="icon-btn" aria-label="Close" onClick={() => setAdding(false)}><X size={20} /></button>
        </div>
        <p className="muted">They get an email invite to set a password.</p>
        <Field label="Full name" value={nu.name} onChange={(v) => { setNu({ ...nu, name: v }); setNuErr(null); }} placeholder="e.g. Ana Reyes" />
        <Field label="Work email" type="email" value={nu.email} onChange={(v) => { setNu({ ...nu, email: v }); setNuErr(null); }} placeholder="name@company.com" />
        <div className="field">
          <label htmlFor="nu-role">Role</label>
          <select id="nu-role" className="select" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>
            {roles.map((r) => <option key={r.role}>{r.role}</option>)}
          </select>
          {role ? <span className="caption">Can see: {role.sees}. {role.clips ? 'Can watch clips.' : 'Cannot watch clips.'}</span> : null}
        </div>
        {nuErr ? <span className="error">{nuErr}</span> : null}
        <div className="spacer" />
        <Button block onClick={addUser}>Send invite</Button>
        <Button block variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
      </div>
    </div>
  ) : null;

  return (
    <Shell title="Settings" overlay={overlay}>
      <div className="settings">
        <nav className="subnav" aria-label="Settings sections">
          {sections.map((s) => (
            <button key={s.id} type="button" className={cx(section === s.id && 'on')} aria-current={section === s.id ? 'page' : undefined} onClick={() => go(s.id)}>
              <s.Icon size={18} />
              {s.label}
            </button>
          ))}
        </nav>
        <div className="settings-body" key={section}>
          {section === 'users' ? (
            <>
              <PageHead title="Users and roles">
                <Button onClick={() => { setNu({ name: '', email: '', role: 'Dispatcher' }); setNuErr(null); setAdding(true); }}>Add user</Button>
              </PageHead>
              <DataTable
                label="Roles"
                cols={['Role', 'Can see', 'Clips']}
                rows={roles}
                cell={(r) => [r.role, r.sees, r.clips ? 'Yes' : 'No']}
                card={(r) => (
                  <>
                    <div className="top"><span className="name">{r.role}</span><span className="caption">{r.clips ? 'Clips: Yes' : 'Clips: No'}</span></div>
                    <span className="caption">{r.sees}</span>
                  </>
                )}
              />
              <DataTable
                label="People with access"
                title="People with access"
                cols={['Name', 'Email', 'Role']}
                rows={users}
                cell={(u) => [u.name, u.email, u.role]}
                card={(u) => (
                  <>
                    <div className="top"><span className="name">{u.name}</span><span className="caption">{u.role}</span></div>
                    <span className="caption">{u.email}</span>
                  </>
                )}
              />
              <RetentionPanel />
            </>
          ) : section === 'clips' ? (
            <>
              <PageHead title="Clip access log" sub="Every time someone watches a clip, it is recorded here.">
                <Button variant="secondary" onClick={() => run('Preparing log…', 'Clip access log exported', undefined, 800)}>Export log</Button>
              </PageHead>
              <DataTable
                label="Clip access log"
                cols={['When', 'Who', 'Role', 'Clip', 'Reason']}
                rows={clipLog}
                cell={(c) => [c.when, c.who, c.role, c.clip, c.why]}
                card={(c) => (
                  <>
                    <div className="top"><span className="name">{c.who}</span><span className="caption">{c.when}</span></div>
                    <span className="caption">{c.clip} · {c.why}</span>
                  </>
                )}
              />
              <p className="caption">This control is available to Fleet Managers and is included in the audit log.</p>
            </>
          ) : section === 'retention' ? (
            <>
              <PageHead title="Data retention" sub="How long Aizu keeps alert clips before deleting them." />
              <RetentionPanel />
            </>
          ) : section === 'notifications' ? (
            <>
              <PageHead title="Notifications" sub="Choose how you hear about alerts." />
              <Panel style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
                {notifRows.map(([k, label, sub]) => (
                  <div key={k} className="toggle-row setting-row">
                    <div>
                      <div style={{ fontWeight: 500 }}>{label}</div>
                      <div className="caption">{sub}</div>
                    </div>
                    <Toggle label={label} on={notif[k]} onChange={(v) => setN(k, v, label)} />
                  </div>
                ))}
              </Panel>
            </>
          ) : section === 'devices' ? (
            <>
              <PageHead title="Devices" sub="Aizu camera units paired to vehicles.">
                <Button variant="secondary" onClick={() => run('Checking for updates…', 'Devices on 1.4.1 will update tonight', undefined, 1100)}>Check for updates</Button>
              </PageHead>
              <DataTable
                label="Devices"
                cols={['Device', 'Vehicle', 'Battery', 'Status', 'Firmware']}
                rows={devices}
                onRow={(d) => toast(`${d.id} on ${d.vehicle}: ${d.status}, battery ${d.battery}`, 'info')}
                cell={(d) => [d.id, d.vehicle, d.battery, <span className={d.status === 'Connected' ? undefined : 'late'}>{d.status}</span>, d.fw]}
                card={(d) => (
                  <>
                    <div className="top"><span className="name">{d.id}</span><span className={d.status === 'Connected' ? 'caption' : 'caption late'}>{d.status}</span></div>
                    <span className="caption">{d.vehicle} · battery {d.battery} · firmware {d.fw}</span>
                  </>
                )}
              />
            </>
          ) : (
            <>
              <PageHead title="Privacy notice" sub="What drivers are told when they join.">
                <Button variant="secondary" onClick={() => run('Sending notice…', 'Privacy notice sent to all drivers', undefined, 900)}>Send to all drivers</Button>
              </PageHead>
              <Panel>
                <p>Aizu watches for signs of drowsiness, such as eyes closing and yawning, to keep drivers and the public safe on the road.</p>
                <p>Video stays on the device. A short clip is saved only for a Level 2 or Level 3 alert and is kept for {retention.replace(' (default)', '')}. Only Fleet Managers and Safety Officers can watch clips, and every view is logged.</p>
                <p>Alerts are used for fatigue prevention and road safety, not for disciplinary action.</p>
              </Panel>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}
