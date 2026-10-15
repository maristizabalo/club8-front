"use client";

import { horaCorta, horas as textoHoras } from "@/lib/formato";
import type { AgendaMesa as Agenda } from "@/lib/tipos";

/* Las horas de una mesa en el día elegido. Se toca la hora de inicio y se ajusta cuántas horas
   se juega; el tramo elegido se marca entero, y no deja estirarlo sobre una hora ocupada. */

export function horasSeguidasLibres(agenda: Agenda, inicio: string) {
  const i = agenda.slots.findIndex((s) => s.time === inicio);
  if (i < 0) return 0;
  let n = 0;
  for (let j = i; j < agenda.slots.length && agenda.slots[j].status === "libre"; j++) n++;
  return n;
}

const ETIQUETA: Record<string, string> = {
  libre: "Libre",
  reservada: "Ocupada",
  bloqueada: "No disponible",
  pasada: "Ya pasó",
};

export function AgendaMesa({
  agenda,
  inicio,
  horas,
  minimo,
  maximo,
  onInicio,
  onHoras,
}: {
  agenda: Agenda;
  inicio: string | null;
  horas: number;
  minimo: number;
  maximo: number;
  onInicio: (hora: string) => void;
  onHoras: (n: number) => void;
}) {
  const iInicio = inicio ? agenda.slots.findIndex((s) => s.time === inicio) : -1;
  const tope = inicio ? Math.min(maximo, horasSeguidasLibres(agenda, inicio)) : maximo;

  return (
    <div className="agenda">
      <div className="agenda__horas" role="group" aria-label={`Horas de la ${agenda.name}`}>
        {agenda.slots.map((s, i) => {
          const dentro = iInicio >= 0 && i >= iInicio && i < iInicio + horas;
          return (
            <button
              key={s.time}
              type="button"
              className="agenda__hora cifras"
              data-estado={s.status}
              data-dentro={dentro || undefined}
              data-inicio={i === iInicio || undefined}
              disabled={s.status !== "libre"}
              aria-pressed={i === iInicio}
              onClick={() => onInicio(s.time)}
              aria-label={`${horaCorta(s.time)}, ${ETIQUETA[s.status]}`}
            >
              <span>{horaCorta(s.time)}</span>
              <small>{i === iInicio ? "Inicio" : dentro ? "Incluida" : ETIQUETA[s.status]}</small>
            </button>
          );
        })}
      </div>

      {inicio ? (
        <div className="agenda__duracion">
          <p className="agenda__pregunta">¿Cuántas horas?</p>
          <div className="contador" role="group" aria-label="Horas de juego">
            <button
              type="button"
              className="contador__boton"
              onClick={() => onHoras(horas - 1)}
              disabled={horas <= minimo}
              aria-label="Una hora menos"
            >
              −
            </button>
            <output className="contador__valor cifras" aria-live="polite">
              {textoHoras(horas)}
            </output>
            <button
              type="button"
              className="contador__boton"
              onClick={() => onHoras(horas + 1)}
              disabled={horas >= tope}
              aria-label="Una hora más"
            >
              +
            </button>
          </div>
          {tope < maximo && horas >= tope ? (
            <p className="agenda__nota">Después de esta hora la mesa ya está ocupada.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
