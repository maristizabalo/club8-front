/* El club como lo ve el sitio.
 *
 * La portada se arma en el servidor con lo que la API dice del club (dirección, horario, tarifas,
 * el plano de las mesas). Se guarda en caché cinco minutos: lo que se cambia en el panel se ve en
 * el sitio a más tardar en ese tiempo, y la portada no golpea la API en cada visita.
 *
 * Si la API no responde (en la compilación de Docker no hay backend, o el backend se reinicia),
 * el sitio no se cae: usa los mismos datos con los que nace el club. */

import { cacheLife, cacheTag } from "next/cache";

import { apiPublica } from "./api";
import type { Club, MesaPublica } from "./tipos";

function mesasIniciales(): MesaPublica[] {
  const columnas = [12, 32, 52, 72];
  const filas = [17, 50, 83];
  const out: MesaPublica[] = [];
  let n = 0;
  for (const y of filas) {
    for (const x of columnas) {
      n++;
      out.push({ id: n, number: n, name: `Mesa ${n}`, detail: "Jimar 2026 · tres bandas", mapX: x, mapY: y, rotation: 0, enabled: true });
    }
  }
  return out;
}

/** Lo mismo que siembra el backend. Sólo se usa si la API no contesta. */
export const CLUB_INICIAL: Club = {
  settings: {
    clubName: "Billares Club 8",
    tagline: "Doce mesas de tres bandas en Chapinero",
    address: "Calle 63 # 15-32",
    neighborhood: "Chapinero",
    city: "Bogotá",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Calle+63+%2315-32+Bogot%C3%A1",
    whatsapp: "573016414894",
    phoneDisplay: "+57 301 641 4894",
    email: "",
    instagram: "https://www.instagram.com/billarclub8/",
    facebook: "https://www.facebook.com/billaresclub8/",
    tiktok: "https://www.tiktok.com/@billares.club.8",
    parking: true,
    paymentKey: "",
    paymentBank: "",
    paymentAccount: "",
    paymentHolder: "",
    minHours: 1,
    maxHours: 4,
    maxPlayers: 4,
    leadMinutes: 60,
    horizonDays: 30,
    cancelHours: 3,
    upcomingAlertMin: 30,
    floorPlan: [
      { kind: "barra", label: "Barra", x: 86, y: 8, w: 11, h: 58 },
      { kind: "entrada", label: "Entrada", x: 86, y: 80, w: 11, h: 14 },
    ],
  },
  hours: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ weekday: d, open: "09:00", close: "24:00", closed: d === 0 })),
  rates: [
    { name: "Mañanas", starts: "09:00", ends: "13:00", price: 30000, unit: "bloque", note: "Las cuatro horas de la mañana por un solo valor." },
    { name: "Tardes", starts: "13:00", ends: "17:00", price: 12000, unit: "hora", note: "Se separa con el valor de una hora." },
    { name: "Noches", starts: "18:00", ends: "24:00", price: 22500, unit: "hora", note: "Se separa con el valor de una hora." },
  ],
  tables: mesasIniciales(),
  today: "",
  maxDate: "",
  timezone: "America/Bogota",
};

/** El club con caché de cinco minutos. Nunca lanza: si la API falla, devuelve CLUB_INICIAL. */
export async function cargarClub(): Promise<{ club: Club; enVivo: boolean }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("club");
  try {
    const club = await apiPublica.club({ timeoutMs: 4000 });
    return { club, enVivo: true };
  } catch {
    return { club: CLUB_INICIAL, enVivo: false };
  }
}

/** Enlace a WhatsApp con un mensaje ya escrito. */
export function enlaceWhatsApp(numero: string, texto: string) {
  const d = numero.replace(/\D/g, "");
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(texto)}` : "";
}
