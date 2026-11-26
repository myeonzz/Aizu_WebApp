import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppProvider, useApp } from './state';
import SignIn from './pages/SignIn';
import Overview from './pages/Overview';
import Incident from './pages/Incident';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Notification from './pages/Notification';
import Vehicles from './pages/Vehicles';

function RequireAuth({ children }: { children: ReactNode }) {
  const { signedIn } = useApp();
  const loc = useLocation();
  return signedIn ? children : <Navigate to="/" replace state={{ next: loc.pathname + loc.search }} />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/overview" element={<RequireAuth><Overview /></RequireAuth>} />
          <Route path="/vehicles" element={<RequireAuth><Vehicles /></RequireAuth>} />
          <Route path="/incident" element={<RequireAuth><Incident /></RequireAuth>} />
          <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
          <Route path="/events/:id" element={<RequireAuth><EventDetail /></RequireAuth>} />
          <Route path="/drivers" element={<RequireAuth><Drivers /></RequireAuth>} />
          <Route path="/drivers/:id" element={<RequireAuth><DriverDetail /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
