/* Cliente de la API.
 *
 * Una sola puerta para hablar con el backend. Centraliza tres cosas que si se repiten se
 * desincronizan: la base de la URL, el token del personal y la traducción de un error HTTP a
 * algo que una pantalla pueda pintar.
 *
 * En el navegador las rutas son relativas (/api/...): Next las reenvía a Go (next.config.ts), así
 * que no hay CORS ni dominio de la API dentro del paquete. En el servidor no hay "mismo origen"
 * contra el que resolver, y se usa la dirección interna. */

import type {
  Ajustes,
  Bloqueo,
  Club,
  CuerpoError,
  DetalleReserva,
  Dia,
  EntradaHistorial,
  EstadoReserva,
  Franja,
  Horario,
  Mesa,
  MotivoBloqueo,
  NuevaReserva,
  Partida,
  Reserva,
  ReservaPublica,
  ResumenDia,
  SesionPersonal,
  Cliente,
  VistaPanel,
  ElementoPlano,
} from "./tipos";

const enServidor = typeof window === "undefined";

export const BASE_API = enServidor
  ? (process.env.API_URL_INTERNA ?? "http://localhost:8080").replace(/\/$/, "")
  : "";

const CLAVE_TOKEN = "c8-token";

/** ErrorAPI conserva el cuerpo entero del error: los formularios necesitan `campos` para pintar
 *  cada mensaje debajo de su input. */
export class ErrorAPI extends Error {
  readonly estado: number;
  readonly codigo: string;
  readonly campos?: Record<string, string>;

  constructor(estado: number, cuerpo: CuerpoError | null, mensajeCrudo?: string) {
    super(cuerpo?.error?.message ?? mensajeCrudo ?? "No se pudo completar la operación.");
    this.name = "ErrorAPI";
    this.estado = estado;
    this.codigo = cuerpo?.error?.code ?? "error_desconocido";
    this.campos = cuerpo?.error?.fields;
  }

  get esSesionCaducada(): boolean {
    return this.estado === 401 && this.codigo !== "credenciales_invalidas";
  }

  get esConflicto(): boolean {
    return this.estado === 409;
  }
}

/** Mensaje legible para cualquier error, venga de la API o de la red. */
export function mensajeDe(error: unknown): string {
  if (error instanceof ErrorAPI) return error.message;
  if (error instanceof TypeError) return "No hay conexión con el club. Revisa tu internet e intenta de nuevo.";
  return "Algo salió mal. Intenta de nuevo en unos segundos.";
}

// ── Token ────────────────────────────────────────────────────────────────────

export function guardarToken(token: string) {
  try {
    window.localStorage.setItem(CLAVE_TOKEN, token);
  } catch {
    /* sin almacenamiento la sesión dura lo que dure la pestaña */
  }
}

export function leerToken(): string | null {
  if (enServidor) return null;
  try {
    return window.localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function borrarToken() {
  try {
    window.localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    /* nada que borrar */
  }
}

// ── Petición base ────────────────────────────────────────────────────────────

type Consulta = Record<string, string | number | boolean | undefined | null>;

interface Opciones extends Omit<RequestInit, "body"> {
  body?: unknown;
  query?: Consulta;
  /** Manda el token del personal. */
  auth?: boolean;
  /** Corta la espera; sin esto un backend caído deja la página colgada. */
  timeoutMs?: number;
}

async function pedir<T>(ruta: string, opts: Opciones = {}): Promise<T> {
  const { body, query, auth = false, timeoutMs = 15000, headers, ...resto } = opts;

  let url = `${BASE_API}${ruta}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const cabeceras = new Headers(headers);
  if (body !== undefined) cabeceras.set("Content-Type", "application/json");
  if (auth) {
    const token = leerToken();
    if (token) cabeceras.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...resto,
    headers: cabeceras,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: resto.signal ?? AbortSignal.timeout(timeoutMs),
  });

  if (res.status === 204) return undefined as T;
  const texto = await res.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }
  if (!res.ok) throw new ErrorAPI(res.status, datos as CuerpoError | null, texto.slice(0, 200));
  return datos as T;
}

// ── Público ──────────────────────────────────────────────────────────────────

export const apiPublica = {
  club: (opts?: Opciones) => pedir<Club>("/api/v1/club", opts),

  dia: (fecha: string, signal?: AbortSignal) =>
    pedir<Dia>("/api/v1/availability", { query: { date: fecha }, signal }),

  dias: (desde: string, n: number, signal?: AbortSignal) =>
    pedir<{ days: ResumenDia[] }>("/api/v1/availability/days", { query: { from: desde, days: n }, signal }).then(
      (r) => r.days,
    ),

  reservar: (datos: NuevaReserva) => pedir<ReservaPublica>("/api/v1/reservations", { method: "POST", body: datos }),

  consultar: (code: string, phone: string) =>
    pedir<ReservaPublica>("/api/v1/reservations/lookup", { method: "POST", body: { code, phone } }),

  cancelar: (code: string, phone: string) =>
    pedir<ReservaPublica>("/api/v1/reservations/cancel", { method: "POST", body: { code, phone } }),
};

// ── Personal ─────────────────────────────────────────────────────────────────

export type FiltroReservas = {
  from?: string;
  to?: string;
  status?: string;
  table?: number;
  q?: string;
};

export type CambiosReserva = Partial<{
  tableId: number;
  date: string;
  time: string;
  hours: number;
  partySize: number;
  notes: string;
  name: string;
  email: string;
}>;

export type CambiosMesa = Partial<{
  name: string;
  detail: string;
  notes: string;
  enabled: boolean;
  mapX: number;
  mapY: number;
  rotation: 0 | 90;
}>;

const conToken = { auth: true } as const;

export const api = {
  ingresar: (email: string, password: string) =>
    pedir<SesionPersonal>("/api/v1/admin/auth/login", { method: "POST", body: { email, password } }),
  yo: () => pedir<SesionPersonal>("/api/v1/admin/auth/me", conToken),

  panel: (fecha?: string) => pedir<VistaPanel>("/api/v1/admin/board", { ...conToken, query: { date: fecha } }),

  reservas: (f: FiltroReservas) =>
    pedir<{ reservations: Reserva[] }>("/api/v1/admin/reservations", { ...conToken, query: f }).then(
      (r) => r.reservations,
    ),
  reserva: (id: number) => pedir<DetalleReserva>(`/api/v1/admin/reservations/${id}`, conToken),
  crearReserva: (datos: NuevaReserva) =>
    pedir<Reserva>("/api/v1/admin/reservations", { ...conToken, method: "POST", body: datos }),
  actualizarReserva: (id: number, cambios: CambiosReserva) =>
    pedir<Reserva>(`/api/v1/admin/reservations/${id}`, { ...conToken, method: "PATCH", body: cambios }),
  cambiarEstado: (id: number, status: EstadoReserva, note = "") =>
    pedir<Reserva>(`/api/v1/admin/reservations/${id}/status`, { ...conToken, method: "POST", body: { status, note } }),

  ocupar: (datos: { tableId: number; reservationId?: number | null; customerName?: string; partySize?: number; notes?: string }) =>
    pedir<Partida>("/api/v1/admin/sessions", {
      ...conToken,
      method: "POST",
      body: {
        tableId: datos.tableId,
        reservationId: datos.reservationId ?? null,
        customerName: datos.customerName ?? "",
        partySize: datos.partySize ?? 0,
        notes: datos.notes ?? "",
      },
    }),
  finalizar: (id: number) => pedir<Partida>(`/api/v1/admin/sessions/${id}/close`, { ...conToken, method: "POST" }),

  mesas: () => pedir<{ tables: Mesa[]; floorPlan: ElementoPlano[] }>("/api/v1/admin/tables", conToken),
  actualizarMesa: (id: number, cambios: CambiosMesa) =>
    pedir<Mesa>(`/api/v1/admin/tables/${id}`, { ...conToken, method: "PATCH", body: cambios }),
  historialMesa: (id: number) =>
    pedir<{ history: EntradaHistorial[] }>(`/api/v1/admin/tables/${id}/history`, conToken).then((r) => r.history),

  bloqueos: () => pedir<{ blocks: Bloqueo[] }>("/api/v1/admin/blocks", conToken).then((r) => r.blocks),
  bloquear: (datos: { tableId: number | null; reason: MotivoBloqueo; note: string; startsAt?: string | null; endsAt?: string | null }) =>
    pedir<Bloqueo>("/api/v1/admin/blocks", {
      ...conToken,
      method: "POST",
      body: { tableId: datos.tableId, reason: datos.reason, note: datos.note, startsAt: datos.startsAt ?? null, endsAt: datos.endsAt ?? null },
    }),
  reactivar: (id: number) => pedir<Bloqueo>(`/api/v1/admin/blocks/${id}/release`, { ...conToken, method: "POST" }),

  clientes: (q: string) =>
    pedir<{ customers: Cliente[] }>("/api/v1/admin/customers", { ...conToken, query: { q } }).then((r) => r.customers),

  ajustes: () => pedir<Ajustes>("/api/v1/admin/settings", conToken),
  guardarAjustes: (a: Ajustes) => pedir<Ajustes>("/api/v1/admin/settings", { ...conToken, method: "PUT", body: a }),
  horario: () => pedir<{ hours: Horario[] }>("/api/v1/admin/hours", conToken).then((r) => r.hours),
  guardarHorario: (hours: Horario[]) =>
    pedir<{ hours: Horario[] }>("/api/v1/admin/hours", { ...conToken, method: "PUT", body: { hours } }).then((r) => r.hours),
  franjas: () => pedir<{ rates: Franja[] }>("/api/v1/admin/rates", conToken).then((r) => r.rates),
  guardarFranjas: (rates: Franja[]) =>
    pedir<{ rates: Franja[] }>("/api/v1/admin/rates", {
      ...conToken,
      method: "PUT",
      body: { rates: rates.map(({ name, starts, ends, price, unit, note }) => ({ name, starts, ends, price, unit, note })) },
    }).then((r) => r.rates),
};
