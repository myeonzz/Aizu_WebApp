// Simulated fleet data. Same drivers and events as the Aizu phone app. There is no back end.
export type Level = 0 | 1 | 2 | 3;

export const levelInfo: Record<Level, { label: string; cls: string }> = {
  0: { label: 'L0 Normal', cls: 'ok' },
  1: { label: 'L1 Caution', cls: 'caution' },
  2: { label: 'L2 Warning', cls: 'warning' },
  3: { label: 'L3 Critical', cls: 'critical' },
};

export type FleetDriver = {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  shift: 'Night' | 'Day';
  route: string;
  level: Level;
  offensesShift: number;
  phone: string;
  synced: string;
  late?: boolean;
  onTrip: boolean;
  week: number;
  weekTrend?: string;
  l3Month: number;
  falseMonth: number;
};

export const drivers: FleetDriver[] = [
  { id: 'juan', phone: '0917 555 0142', name: 'Juan Dela Cruz', vehicle: 'Van 02', plate: 'NDE 5678', shift: 'Night', route: 'Imus – Laguna', level: 3, offensesShift: 3, synced: '1 min ago', onTrip: true, week: 9, weekTrend: 'up from 4', l3Month: 3, falseMonth: 0 },
  { id: 'ramon', phone: '0918 555 0177', name: 'Ramon Villanueva', vehicle: 'Truck 01', plate: 'NMN 2468', shift: 'Night', route: 'Warehouse – Batangas', level: 2, offensesShift: 2, synced: '2 min ago', onTrip: true, week: 5, weekTrend: 'same', l3Month: 0, falseMonth: 1 },
  { id: 'dennis', phone: '0919 555 0123', name: 'Dennis Garcia', vehicle: 'Truck 02', plate: 'NPQ 1357', shift: 'Night', route: 'Warehouse – Laguna', level: 0, offensesShift: 1, synced: '14 min ago · data may be late', late: true, onTrip: true, week: 3, weekTrend: 'down from 6', l3Month: 0, falseMonth: 2 },
  { id: 'carlo', phone: '0917 555 0190', name: 'Carlo Mendoza', vehicle: 'Van 04', plate: 'NHJ 3456', shift: 'Night', route: 'Manila – Batangas', level: 0, offensesShift: 0, synced: '1 min ago', onTrip: true, week: 2, l3Month: 0, falseMonth: 0 },
  { id: 'mark', phone: '0920 555 0111', name: 'Mark Reyes', vehicle: 'Van 01', plate: 'NBC 1234', shift: 'Day', route: 'Imus – Manila', level: 0, offensesShift: 0, synced: '9 h ago', onTrip: false, week: 1, l3Month: 0, falseMonth: 0 },
  { id: 'ben', phone: '0921 555 0164', name: 'Ben Castillo', vehicle: 'Van 03', plate: 'NAB 2244', shift: 'Day', route: 'Reliever', level: 0, offensesShift: 0, synced: '10 h ago', onTrip: false, week: 0, l3Month: 0, falseMonth: 0 },
  { id: 'paolo', phone: '0922 555 0135', name: 'Paolo Santos', vehicle: 'SUV 01', plate: 'NCD 7788', shift: 'Day', route: 'Office runs', level: 0, offensesShift: 0, synced: '11 h ago', onTrip: false, week: 0, l3Month: 0, falseMonth: 0 },
  { id: 'rico', phone: '0923 555 0158', name: 'Rico Bautista', vehicle: 'Truck 03', plate: 'NQR 9090', shift: 'Day', route: 'Warehouse – Cavite', level: 0, offensesShift: 0, synced: '12 h ago', onTrip: false, week: 0, l3Month: 0, falseMonth: 0 },
];

export type Review = 'Not reviewed' | 'Confirmed' | 'False alarm' | '—';

export type FleetEvent = {
  id: string;
  day: 'TODAY' | 'YESTERDAY';
  time: string;
  date: string;
  level: Level;
  driverId: string;
  behavior: string;
  location: string;
  clip: boolean;
  review: Review;
  reason?: string;
  offenses10: number;
  synced: string;
  explanation?: string;
};

export const seedEvents: FleetEvent[] = [
  { id: 'e5', day: 'TODAY', time: '2:47 AM', date: 'Nov 20', level: 3, driverId: 'juan', behavior: 'Eyes closed 3.4 s', location: 'SLEX near Alabang, Muntinlupa', clip: true, review: 'Not reviewed', offenses10: 3, synced: '2:47 AM' },
  { id: 'e4', day: 'TODAY', time: '2:21 AM', date: 'Nov 20', level: 2, driverId: 'ramon', behavior: 'Yawn 4.6 s', location: 'STAR Tollway, Lipa, Batangas', clip: true, review: 'Not reviewed', offenses10: 2, synced: '2:22 AM' },
  { id: 'e3', day: 'TODAY', time: '1:58 AM', date: 'Nov 20', level: 3, driverId: 'juan', behavior: 'Eyes closed 3.1 s', location: 'Biñan, Laguna', clip: true, review: 'Confirmed', offenses10: 2, synced: '1:58 AM', explanation: 'I was tired' },
  { id: 'e2', day: 'TODAY', time: '12:40 AM', date: 'Nov 20', level: 2, driverId: 'dennis', behavior: 'Eyes closed 2.3 s', location: 'Calamba, Laguna', clip: true, review: 'False alarm', reason: 'Glare or shadow', offenses10: 1, synced: '12:41 AM', explanation: 'Glare or shadow' },
  { id: 'e1', day: 'YESTERDAY', time: '11:12 PM', date: 'Nov 19', level: 1, driverId: 'carlo', behavior: 'Yawn', location: 'Location unavailable', clip: false, review: '—', offenses10: 1, synced: '11:30 PM' },
];

export const driverById = (id: string) => drivers.find((d) => d.id === id);

export const roles = [
  { role: 'Fleet Manager', sees: 'Everything', clips: true },
  { role: 'Safety Officer', sees: 'Alerts, incidents, clips', clips: true },
  { role: 'Dispatcher', sees: 'Live alerts and incidents', clips: false },
  { role: 'Warehouse OIC', sees: 'Alerts and incidents', clips: false },
  { role: 'HR', sees: 'Incidents and reports', clips: false },
];

export const reportRanges = {
  'This week': { l1: 14, l2: 9, l3: 4, fa: 3, per: [9, 5, 3, 2, 1, 0, 0, 0], dn: [3, 9] },
  'This month': { l1: 52, l2: 31, l3: 11, fa: 9, per: [24, 18, 12, 9, 6, 2, 1, 0], dn: [12, 34] },
  'Last 3 months': { l1: 140, l2: 88, l3: 27, fa: 22, per: [61, 44, 35, 22, 15, 6, 4, 2], dn: [37, 101] },
} as const;

export type ReportRange = keyof typeof reportRanges;

// Vehicles (Figma "Vehicles" tab). Status counts: 4 on trip, 3 parked, 1 offline or late.
export type VehicleStatus = 'On trip' | 'Parked' | 'Maintenance';
export type Vehicle = {
  id: string;
  name: string;
  type: 'Van' | 'Truck' | 'SUV';
  plate: string;
  driverId: string | null;
  status: VehicleStatus;
  route: string;
  synced: string;
  late?: boolean;
  device: string;
};
const vstatus = (d: FleetDriver): VehicleStatus => (d.onTrip ? 'On trip' : d.id === 'rico' ? 'Maintenance' : 'Parked');
export const seedVehicles: Vehicle[] = drivers.map((d, i) => ({
  id: 'v' + (i + 1),
  name: d.vehicle,
  type: d.vehicle.split(' ')[0] as Vehicle['type'],
  plate: d.plate,
  driverId: d.id,
  status: vstatus(d),
  route: d.onTrip ? d.route : vstatus(d) === 'Maintenance' ? 'In the shop' : 'Depot, Imus',
  synced: d.synced,
  late: d.late,
  device: `AIZU-${String(1041 + i)}`,
}));
