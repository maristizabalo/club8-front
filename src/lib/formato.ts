/* Formatos de fecha, hora y dinero. Todo en español de Colombia y en la hora del club: una
 * reserva de las 20:00 se muestra como 8:00 p. m. aunque el navegador esté en otro país. */

export const ZONA_CLUB = "America/Bogota";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Partes de una fecha AAAA-MM-DD sin pasar por Date (que la movería a la zona del navegador). */
export function partesFecha(fecha: string) {
  const [a, m, d] = fecha.split("-").map(Number);
  // Mediodía UTC: el día de la semana sale bien en cualquier zona.
  const dia = new Date(Date.UTC(a, m - 1, d, 12)).getUTCDay();
  return { anio: a, mes: m, dia: d, semana: dia };
}

export function nombreDia(weekday: number) {
  return DIAS[weekday] ?? "";
}

export function nombreDiaCorto(weekday: number) {
  return DIAS_CORTOS[weekday] ?? "";
}

export function nombreMes(mes: number) {
  return MESES[mes - 1] ?? "";
}

/** "jueves 15 de octubre" */
export function fechaLarga(fecha: string) {
  const p = partesFecha(fecha);
  return `${DIAS[p.semana]} ${p.dia} de ${MESES[p.mes - 1]}`;
}

/** "15 oct" */
export function fechaCorta(fecha: string) {
  const p = partesFecha(fecha);
  return `${p.dia} ${MESES[p.mes - 1].slice(0, 3)}`;
}

/* Entre la cifra y "a. m." van espacios que no se parten: "9:00 a." al final de una línea y
   "m." al principio de la siguiente no se lee como una hora. */
const NB = " ";

/** "20:00" → "8:00 p. m."; "24:00" → "12:00 a. m." */
export function hora12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h >= 12 && h < 24 ? `p.${NB}m.` : `a.${NB}m.`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")}${NB}${sufijo}`;
}

/** "20:00" → "8 p. m." cuando la hora es en punto. Para chips y etiquetas cortas. */
export function horaCorta(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h >= 12 && h < 24 ? `p.${NB}m.` : `a.${NB}m.`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${NB}${sufijo}` : `${h12}:${String(m).padStart(2, "0")}${NB}${sufijo}`;
}

export function minutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function hhmm(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

const PESOS = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/** 22500 → "$ 22.500", con un espacio que no se parte entre el signo y la cifra. */
export function pesos(valor: number) {
  return PESOS.format(valor);
}

/** La fecha y la hora del club ahora mismo. */
export function ahoraEnElClub(instante: Date = new Date()): { fecha: string; minutos: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_CLUB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instante);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "00";
  return { fecha: `${v("year")}-${v("month")}-${v("day")}`, minutos: Number(v("hour")) * 60 + Number(v("minute")) };
}

/** Suma días a una fecha AAAA-MM-DD. */
export function sumarDias(fecha: string, n: number) {
  const p = partesFecha(fecha);
  const d = new Date(Date.UTC(p.anio, p.mes - 1, p.dia + n, 12));
  return d.toISOString().slice(0, 10);
}

/** "1 hora", "2 horas" */
export function horas(n: number) {
  return n === 1 ? "1 hora" : `${n} horas`;
}

/** Hora de un instante ISO en el club: "8:05 p. m." */
export function horaDeInstante(iso: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: ZONA_CLUB, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

/** Fecha y hora de un instante ISO en el club: "15 oct, 8:05 p. m." */
export function fechaHoraDeInstante(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA_CLUB,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Tiempo transcurrido desde un instante: "1 h 24 min" */
export function transcurrido(desdeIso: string, ahora = Date.now()) {
  const min = Math.max(0, Math.floor((ahora - new Date(desdeIso).getTime()) / 60000));
  const h = Math.floor(min / 60);
  return h > 0 ? `${h} h ${String(min % 60).padStart(2, "0")} min` : `${min} min`;
}

/** Celular colombiano legible: 573016414894 → "301 641 4894" */
export function celular(digitos: string) {
  const d = digitos.replace(/\D/g, "");
  const local = d.length === 12 && d.startsWith("57") ? d.slice(2) : d;
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : digitos;
}
