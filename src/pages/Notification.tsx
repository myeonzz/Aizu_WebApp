// M02 Push notification, shown as a phone lock screen. Tapping it opens the overview.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, Toasts, callDriver } from '../ui';
import { driverById } from '../data';
import { useApp } from '../state';
import mark from '../assets/aizu-mark.png';

const juan = driverById('juan')!;

export default function Notification() {
  const navigate = useNavigate();
  const { toast } = useApp();
  useEffect(() => {
    document.title = 'Notification · Aizu Fleet';
  }, []);
  return (
    <div className="lock">
      <div className="glow" />
      <div className="time">2:47</div>
      <div style={{ fontWeight: 500, fontSize: 16 }}>Friday, November 20</div>
      <div className="notif" role="button" tabIndex={0} onClick={() => navigate('/overview')} onKeyDown={(e) => e.key === 'Enter' && navigate('/overview')}>
        <div className="app">
          <img src={mark} alt="" /> Aizu <span>AIZU · now</span>
        </div>
        <p style={{ fontSize: 16, lineHeight: '24px' }}>
          L3 Critical: Juan Dela Cruz (Van 02) eyes closed 3.4 s near Alabang. 2nd Level 3 this trip.
        </p>
        <div className="chips" onClick={(e) => e.stopPropagation()}>
          <Chip onClick={() => callDriver(toast, juan.name, juan.phone)}>Call driver</Chip>
          <Chip onClick={() => { toast('Opening Aizu Fleet…', 'info'); navigate('/overview'); }}>Open</Chip>
        </div>
      </div>
      <p className="caption" style={{ color: 'var(--text-inv-2)', marginTop: 24, position: 'relative' }}>Tap the notification to open the fleet overview</p>
      <Toasts />
    </div>
  );
}
