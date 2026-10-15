/* Contrato con la API de Go.
 *
 * Cada tipo de aquí es la forma exacta de lo que responde el backend: los nombres de campo van
 * en inglés porque así salen del JSON, y el resto del frontend habla en español. Si el backend
 * cambia un campo, se cambia aquí y TypeScript señala cada pantalla que lo usaba. */

// ── Club ────────────────────────────────────────────────────────────────────

export type ElementoPlano = {
  kind: "barra" | "entrada" | "ventanal" | "columna" | "bano" | "escalera" | string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Ajustes = {
  clubName: string;
  tagline: string;
  address: string;
  neighborhood: string;
  city: string;
  mapsUrl: string;
  whatsapp: string;
  phoneDisplay: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  parking: boolean;
  paymentKey: string;
  paymentBank: string;
  paymentAccount: string;
  paymentHolder: string;
  minHours: number;
  maxHours: number;
  maxPlayers: number;
  leadMinutes: number;
  horizonDays: number;
  cancelHours: number;
  upcomingAlertMin: number;
  floorPlan: ElementoPlano[];
};

export type Horario = {
  weekday: number; // 0 = domingo
  open: string;
  close: string;
  closed: boolean;
};

export type Franja = {
  id?: number;
  name: string;
  starts: string;
  ends: string;
  price: number;
  unit: "hora" | "bloque";
  note: string;
  sortOrder?: number;
};

export type MesaPublica = {
  id: number;
  number: number;
  name: string;
  detail: string;
  mapX: number;
  mapY: number;
  rotation: 0 | 90;
  enabled: boolean;
};

export type Club = {
  settings: Ajustes;
  hours: Horario[];
  rates: Franja[];
  tables: MesaPublica[];
  today: string;
  maxDate: string;
  timezone: string;
};

// ── Disponibilidad ──────────────────────────────────────────────────────────

export type EstadoHora = "libre" | "reservada" | "bloqueada" | "pasada";
export type EstadoMesa = "LIBRE" | "EN_JUEGO" | "BLOQUEADA" | "FUERA_DE_SERVICIO";

export type Hora = {
  time: string;
  status: EstadoHora;
  reservationId?: number;
};

export type AgendaMesa = {
  tableId: number;
  number: number;
  name: string;
  enabled: boolean;
  free: number;
  slots: Hora[];
  now?: EstadoMesa;
};

export type Dia = {
  date: string;
  weekday: number;
  closed: boolean;
  open: string;
  close: string;
  times: string[];
  tables: AgendaMesa[];
  isToday: boolean;
};

export type ResumenDia = {
  date: string;
  weekday: number;
  closed: boolean;
  free: number;
  total: number;
};

// ── Reservas ────────────────────────────────────────────────────────────────

export type EstadoReserva = "PENDIENTE" | "CONFIRMADA" | "ATENDIDA" | "CANCELADA" | "NO_PRESENTADO";
export type OrigenReserva = "web" | "telefono" | "admin";

export type Anticipo = { amount: number; band: string; label: string };

export type NuevaReserva = {
  tableId: number;
  date: string;
  time: string;
  hours: number;
  partySize: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status?: EstadoReserva;
  source?: OrigenReserva;
};

/** Una reserva como la ve su dueño en el sitio. */
export type ReservaPublica = {
  code: string;
  status: EstadoReserva;
  statusLabel: string;
  date: string;
  time: string;
  endTime: string;
  durationMin: number;
  partySize: number;
  table: MesaPublica;
  customerName: string;
  phoneHint: string;
  notes: string;
  deposit: Anticipo | null;
  payment: { key: string; bank: string; account: string; holder: string };
  whatsappUrl: string;
  canCancel: boolean;
  cancelUntil: string | null;
  createdAt: string;
};

export type Cliente = {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  visitsCount: number;
  lastVisitAt: string | null;
  createdAt: string;
};

export type Mesa = MesaPublica & { notes: string; sortOrder: number };

/** Una reserva como la ve el personal. */
export type Reserva = {
  id: number;
  code: string;
  customerId: number;
  customer: Cliente;
  tableId: number;
  table: Mesa;
  date: string;
  time: string;
  endTime: string;
  durationMin: number;
  partySize: number;
  status: EstadoReserva;
  statusLabel: string;
  notes: string;
  source: OrigenReserva;
  createdAt: string;
  updatedAt: string;
  transitions: EstadoReserva[];
};

export type EntradaHistorial = {
  id: number;
  action: string;
  summary: string;
  actorName: string;
  at: string;
};

export type DetalleReserva = {
  reservation: Reserva;
  history: EntradaHistorial[];
  deposit: Anticipo | null;
  whatsappUrl: string;
};

// ── Operación ───────────────────────────────────────────────────────────────

export type Partida = {
  id: number;
  tableId: number;
  reservationId: number | null;
  customerName: string;
  partySize: number;
  notes: string;
  startedAt: string;
  endedAt: string | null;
  durationMin: number | null;
};

export type MotivoBloqueo =
  | "mantenimiento"
  | "danio"
  | "limpieza"
  | "torneo"
  | "evento"
  | "uso_interno"
  | "otro";

export type Bloqueo = {
  id: number;
  tableId: number | null;
  reason: MotivoBloqueo;
  note: string;
  startsAt: string;
  endsAt: string | null;
  createdByName?: string;
  createdAt: string;
  releasedAt: string | null;
};

export type MesaPanel = {
  table: Mesa;
  state: EstadoMesa;
  session: Partida | null;
  block: Bloqueo | null;
  next: Reserva | null;
  alert: string;
};

export type VistaPanel = {
  date: string;
  now: string;
  isToday: boolean;
  kpis: { reservations: number; pending: number; inPlay: number; free: number; blocked: number; playersNow: number };
  tables: MesaPanel[];
  reservations: Reserva[];
  agenda: Dia;
  rates: Franja[];
  floorPlan: ElementoPlano[];
};

// ── Personal ────────────────────────────────────────────────────────────────

export type Permiso = "ver:panel" | "operar:mesas" | "gestionar:reservas" | "gestionar:club";

export type Usuario = {
  id: number;
  name: string;
  email: string;
  role: "ADMINISTRADOR" | "OPERACION" | "CONSULTA";
  active: boolean;
  lastLoginAt: string | null;
};

export type SesionPersonal = {
  token?: string;
  expiresAt?: string;
  user: Usuario;
  permissions: Permiso[];
};

// ── Errores ─────────────────────────────────────────────────────────────────

export type CuerpoError = {
  error?: { code: string; message: string; fields?: Record<string, string> };
};
