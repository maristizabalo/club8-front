"use client";

import { useMemo, useState } from "react";

import { IconoFlecha } from "@/components/sitio/Iconos";
import { nombreMes, partesFecha } from "@/lib/formato";
import type { ResumenDia } from "@/lib/tipos";

/* El calendario del mes, para quien quiere ver más lejos que la tira. Sólo se pueden elegir los
   días que la agenda ya abrió; los cerrados se ven pero no se eligen. La semana empieza el lunes. */

const SEMANA = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

export function Calendario({
  dias,
  fecha,
  onElegir,
}: {
  dias: ResumenDia[];
  fecha: string;
  onElegir: (fecha: string) => void;
}) {
  const porFecha = useMemo(() => new Map(dias.map((d) => [d.date, d])), [dias]);
  const meses = useMemo(() => {
    const vistos: Array<{ anio: number; mes: number }> = [];
    for (const d of dias) {
      const p = partesFecha(d.date);
      if (!vistos.some((m) => m.anio === p.anio && m.mes === p.mes)) vistos.push({ anio: p.anio, mes: p.mes });
    }
    return vistos;
  }, [dias]);

  const inicial = Math.max(
    0,
    meses.findIndex((m) => {
      const p = partesFecha(fecha);
      return m.anio === p.anio && m.mes === p.mes;
    }),
  );
  const [indice, setIndice] = useState(inicial);
  const actual = meses[indice];
  if (!actual) return null;

  const primero = new Date(Date.UTC(actual.anio, actual.mes - 1, 1, 12));
  const diasEnMes = new Date(Date.UTC(actual.anio, actual.mes, 0, 12)).getUTCDate();
  const desfase = (primero.getUTCDay() + 6) % 7; // lunes = 0
  const celdas: Array<string | null> = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => `${actual.anio}-${String(actual.mes).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];

  return (
    <div className="calendario">
      <div className="calendario__cabeza">
        <button
          type="button"
          className="calendario__mover"
          onClick={() => setIndice((i) => Math.max(0, i - 1))}
          disabled={indice === 0}
          aria-label="Mes anterior"
        >
          <IconoFlecha direccion="izquierda" />
        </button>
        <p className="calendario__mes">
          {nombreMes(actual.mes)} {actual.anio}
        </p>
        <button
          type="button"
          className="calendario__mover"
          onClick={() => setIndice((i) => Math.min(meses.length - 1, i + 1))}
          disabled={indice >= meses.length - 1}
          aria-label="Mes siguiente"
        >
          <IconoFlecha />
        </button>
      </div>
      <div className="calendario__rejilla" role="group" aria-label={`${nombreMes(actual.mes)} ${actual.anio}`}>
        {SEMANA.map((s) => (
          <span key={s} className="calendario__semana" aria-hidden="true">
            {s}
          </span>
        ))}
        {celdas.map((c, i) => {
          if (!c) return <span key={`v${i}`} />;
          const d = porFecha.get(c);
          const p = partesFecha(c);
          const elegible = !!d && !d.closed;
          const lleno = !!d && !d.closed && d.free === 0;
          return (
            <button
              key={c}
              type="button"
              className="calendario__dia cifras"
              aria-pressed={c === fecha}
              disabled={!elegible}
              data-lleno={lleno || undefined}
              onClick={() => onElegir(c)}
              aria-label={`${p.dia} de ${nombreMes(p.mes)}${!d ? ", fuera de la agenda" : d.closed ? ", cerrado" : lleno ? ", sin horas libres" : ""}`}
            >
              {p.dia}
            </button>
          );
        })}
      </div>
    </div>
  );
}
