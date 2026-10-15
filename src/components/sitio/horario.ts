import { nombreDia } from "@/lib/formato";
import type { Horario } from "@/lib/tipos";

/* Junta los días seguidos con el mismo horario: "lunes a sábado: 9:00 a. m. a 12:00 a. m." en vez
   de seis líneas iguales. La semana se lee de lunes a domingo, como la lee la gente. */

export type GrupoHorario = { dias: string; abre: string; cierra: string; cerrado: boolean };

const ORDEN = [1, 2, 3, 4, 5, 6, 0];

export function horarioAgrupado(horas: Horario[]): GrupoHorario[] {
  const porDia = new Map(horas.map((h) => [h.weekday, h]));
  const grupos: Array<{ desde: number; hasta: number; h: Horario }> = [];
  for (const d of ORDEN) {
    const h = porDia.get(d) ?? { weekday: d, open: "", close: "", closed: true };
    const ultimo = grupos[grupos.length - 1];
    const igual =
      ultimo && ultimo.h.closed === h.closed && (h.closed || (ultimo.h.open === h.open && ultimo.h.close === h.close));
    if (igual) ultimo.hasta = d;
    else grupos.push({ desde: d, hasta: d, h });
  }
  return grupos.map((g) => {
    const dias = g.desde === g.hasta ? nombreDia(g.desde) : `${nombreDia(g.desde)} a ${nombreDia(g.hasta)}`;
    return { dias: dias.charAt(0).toUpperCase() + dias.slice(1), abre: g.h.open, cierra: g.h.close, cerrado: g.h.closed };
  });
}
