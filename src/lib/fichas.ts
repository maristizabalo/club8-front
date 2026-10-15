/* Traduce la disponibilidad de un día a lo que dibuja el plano. Vive aparte para que la portada y
 * la página de reserva pinten exactamente lo mismo con los mismos datos. */

import type { FichaPlano } from "@/components/plano/Plano";

import { horaCorta, nombreDia, partesFecha } from "./formato";
import type { AgendaMesa, Dia, MesaPublica } from "./tipos";

export function horasLibres(n: number) {
  return n === 1 ? "1 h libre" : `${n} h libres`;
}

export function libreA(agenda: AgendaMesa | undefined, hora: string) {
  return agenda?.slots.find((s) => s.time === hora)?.status === "libre";
}

export function fichasDelDia(
  mesas: MesaPublica[],
  dia: Dia | null,
  hora: string | null = null,
): FichaPlano[] {
  const cuando = dia ? (dia.isToday ? "hoy" : `el ${nombreDia(partesFecha(dia.date).semana)}`) : "";

  return mesas.map((m) => {
    const base: FichaPlano = {
      id: m.id,
      numero: m.number,
      nombre: m.name,
      x: m.mapX,
      y: m.mapY,
      vertical: m.rotation === 90,
      tono: "vivo",
    };
    if (!m.enabled) {
      return { ...base, tono: "fuera", etiqueta: "Fuera de servicio", descripcion: "fuera de servicio" };
    }
    if (!dia) return base;
    if (dia.closed) {
      return { ...base, tono: "apagado", etiqueta: "Cerrado", descripcion: `el club está cerrado ${cuando}` };
    }

    const agenda = dia.tables.find((t) => t.tableId === m.id);
    const libres = agenda?.free ?? 0;
    const tira = agenda?.slots.map((s) =>
      s.status === "libre" ? ("libre" as const) : s.status === "pasada" ? ("pasada" as const) : ("tomada" as const),
    );
    const todaBloqueada = !!agenda && agenda.slots.length > 0 && agenda.slots.every((s) => s.status === "bloqueada");

    let ficha: FichaPlano = {
      ...base,
      horas: tira,
      tono: todaBloqueada ? "rayado" : libres === 0 ? "apagado" : libres <= 2 ? "hondo" : "vivo",
      etiqueta: todaBloqueada ? "No disponible" : libres === 0 ? "Sin horas libres" : horasLibres(libres),
      descripcion: todaBloqueada
        ? `no disponible ${cuando}`
        : libres === 0
          ? `sin horas libres ${cuando}`
          : `${horasLibres(libres)} ${cuando}`,
    };

    if (hora) {
      const libre = libreA(agenda, hora);
      ficha = {
        ...ficha,
        resaltada: libre,
        atenuada: !libre,
        etiqueta: libre ? `Libre ${horaCorta(hora)}` : "Ocupada",
        descripcion: libre ? `libre a las ${horaCorta(hora)} ${cuando}` : `no está libre a las ${horaCorta(hora)}`,
      };
    }
    return ficha;
  });
}
