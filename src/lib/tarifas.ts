import { minutos, pesos } from "./formato";
import type { Franja } from "./tipos";

/* Lo que cuesta un tramo de horas, dicho como lo dice el club: por franja. Una hora sin franja
 * publicada se marca "por confirmar" y nunca se le pone precio. */

export function franjaDe(franjas: Franja[], hhmm: string): Franja | null {
  const m = minutos(hhmm);
  return franjas.find((f) => m >= minutos(f.starts) && m < minutos(f.ends)) ?? null;
}

export function precioFranja(f: Franja) {
  return f.unit === "bloque" ? `${pesos(f.price)} el plan` : `${pesos(f.price)} la hora`;
}

/** Las franjas que toca una reserva, en orden, sin repetir. */
export function franjasDelTramo(franjas: Franja[], inicio: string, horas: number) {
  const out: Array<{ nombre: string; precio: string }> = [];
  let sinTarifa = false;
  for (let i = 0; i < horas; i++) {
    const h = minutos(inicio) + i * 60;
    const f = franjaDe(franjas, `${String(Math.floor(h / 60)).padStart(2, "0")}:${String(h % 60).padStart(2, "0")}`);
    if (!f) {
      sinTarifa = true;
      continue;
    }
    if (!out.some((o) => o.nombre === f.name)) out.push({ nombre: f.name, precio: precioFranja(f) });
  }
  if (sinTarifa) out.push({ nombre: "Entre franjas", precio: "por confirmar" });
  return out;
}

/** El anticipo: el valor de una hora de la franja en la que empieza, o el plan si va por bloque. */
export function anticipoDe(franjas: Franja[], inicio: string) {
  const f = franjaDe(franjas, inicio);
  if (!f || f.price <= 0) return null;
  return { valor: f.price, texto: f.unit === "bloque" ? `el plan de ${f.name.toLowerCase()}` : `una hora de ${f.name.toLowerCase()}` };
}
