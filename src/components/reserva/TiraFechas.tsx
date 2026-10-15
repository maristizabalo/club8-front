"use client";

import { useEffect, useRef } from "react";

import { nombreDiaCorto, partesFecha, sumarDias } from "@/lib/formato";
import type { ResumenDia } from "@/lib/tipos";

/* Los próximos días en una tira que se desliza con el dedo. Cada día dice si está cerrado y, con
   una barra, qué tanto le queda libre. El día elegido se mantiene a la vista. */

export function TiraFechas({
  dias,
  fecha,
  hoy,
  onElegir,
}: {
  dias: ResumenDia[];
  fecha: string;
  hoy: string;
  onElegir: (fecha: string) => void;
}) {
  const tira = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tira.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [fecha]);

  return (
    <div ref={tira} className="tira" role="group" aria-label="Elige el día">
      {dias.map((d) => {
        const p = partesFecha(d.date);
        const lleno = !d.closed && d.free === 0;
        const nombre = d.date === hoy ? "Hoy" : d.date === sumarDias(hoy, 1) ? "Mañana" : nombreDiaCorto(p.semana);
        const proporcion = d.total > 0 ? d.free / d.total : 0;
        return (
          <button
            key={d.date}
            type="button"
            className="tira__dia"
            aria-pressed={d.date === fecha}
            disabled={d.closed}
            onClick={() => onElegir(d.date)}
            aria-label={`${nombre} ${p.dia}${d.closed ? ", cerrado" : lleno ? ", sin horas libres" : ""}`}
          >
            <span className="tira__nombre">{nombre}</span>
            <span className="tira__numero cifras">{p.dia}</span>
            <span className="tira__estado">{d.closed ? "Cerrado" : lleno ? "Lleno" : ""}</span>
            {!d.closed ? (
              <span className="tira__barra" aria-hidden="true">
                <i style={{ width: `${Math.round(proporcion * 100)}%` }} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
