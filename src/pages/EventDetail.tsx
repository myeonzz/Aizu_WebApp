// W08 Event detail and clip review
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, Chip, ClipPlayer, LevelBadge, Panel, Shell, Status } from '../ui';
import { driverById } from '../data';
import { useApp } from '../state';

const reasons = ['Road bump', 'Glare or shadow', 'Looking down', 'Other'];

export default function EventDetail() {
  const { id } = useParams();
  const { events, reviewEvent, toast, run } = useApp();
  const [askReason, setAskReason] = useState(false);
  const e = events.find((x) => x.id === id);
  if (!e) return <Navigate to="/events" replace />;
  const d = driverById(e.driverId)!;

  return (
    <Shell title="Event detail">
      <Link to="/events" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <ArrowLeft size={16} /> All events
      </Link>
      <div className="row">
        <div className="stack" style={{ flex: 680, gap: 16 }}>
          {e.clip ? (
            <ClipPlayer stamp={`${d.vehicle} · IR`} />
          ) : (
            <Panel style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
              <p className="muted">No clip for this event. Level 1 alerts don't save a clip.</p>
            </Panel>
          )}
          <Panel>
            <h3>Is this drowsiness?</h3>
            <div className="chips">
              <Button onClick={() => { setAskReason(false); run('Saving review…', 'Marked as confirmed drowsiness', () => reviewEvent(e.id, 'Confirmed'), 700); }}>Confirmed</Button>
              <Button variant="secondary" onClick={() => { setAskReason(true); toast('Choose why it is a false alarm', 'info'); }}>False alarm</Button>
            </div>
            {askReason ? (
              <>
                <span className="muted">Why is it a false alarm?</span>
                <div className="chips">
                  {reasons.map((r) => (
                    <Chip key={r} onClick={() => { setAskReason(false); run('Saving review…', `Marked as false alarm: ${r}`, () => reviewEvent(e.id, 'False alarm', r), 700); }}>{r}</Chip>
                  ))}
                </div>
              </>
            ) : (
              <p className="caption">
                {e.review === 'Not reviewed' || e.review === '—'
                  ? 'False alarm asks for a reason: Road bump, Glare or shadow, Looking down, Other.'
                  : `Marked as: ${e.review}${e.reason ? ` (${e.reason})` : ''}`}
              </p>
            )}
          </Panel>
        </div>
        <Panel style={{ flex: 422, gap: 16 }}>
          <LevelBadge level={e.level} />
          <h3>Details</h3>
          <Status
            rows={[
              ['Driver', <Link to={`/drivers/${d.id}`}>{d.name}</Link>],
              ['Vehicle', `${d.vehicle} · ${d.plate}`],
              ['Shift', d.shift],
              ['Date and time', `${e.date}, ${e.time}`],
              ['Behavior', e.behavior],
              ['Offenses in last 10 min', e.offenses10],
              ['Location', e.location],
              ['Synced', e.synced],
              ["Driver's explanation", e.explanation ?? <span className="muted">Not added yet</span>],
            ]}
          />
          {e.clip ? <p className="caption">This clip will be deleted automatically on Dec 20, 2026.</p> : null}
          <p className="caption">Your view of this clip is logged.</p>
        </Panel>
      </div>
    </Shell>
  );
}
