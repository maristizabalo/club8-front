import type { CSSProperties } from "react";

import { hora12, horaCorta, minutos, pesos } from "@/lib/formato";
import type { Franja } from "@/lib/tipos";

/* Las tarifas dibujadas como el día del club: una regla de la apertura al cierre, partida en sus
   franjas, cada una del ancho de las horas que cubre. Una hora que no tiene tarifa publicada se
   ve como hueco y dice "por confirmar", en vez de inventarle un precio. */

type Tramo = { desde: string; hasta: string; franja: Franja | null };

function tramos(franjas: Franja[], abre: string, cierra: string): Tramo[] {
  const orden = [...franjas].sort((a, b) => minutos(a.starts) - minutos(b.starts));
  const out: Tramo[] = [];
  let cursor = minutos(abre);
  const fin = minutos(cierra);
  for (const f of orden) {
    const i = Math.max(minutos(f.starts), minutos(abre));
    const j = Math.min(minutos(f.ends), fin);
    if (j <= i) continue;
    if (i > cursor) out.push({ desde: aHHMM(cursor), hasta: aHHMM(i), franja: null });
    out.push({ desde: aHHMM(i), hasta: aHHMM(j), franja: f });
    cursor = j;
  }
  if (cursor < fin) out.push({ desde: aHHMM(cursor), hasta: aHHMM(fin), franja: null });
  return out;
}

const aHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function ReglaTarifas({ franjas, abre, cierra }: { franjas: Franja[]; abre: string; cierra: string }) {
  const lista = tramos(franjas, abre, cierra);
  const total = minutos(cierra) - minutos(abre);

  return (
    <ol className="regla" aria-label={`Tarifas del día, de ${hora12(abre)} a ${hora12(cierra)}`}>
      {lista.map((t) => {
        const ancho = ((minutos(t.hasta) - minutos(t.desde)) / total) * 100;
        const horasTramo = (minutos(t.hasta) - minutos(t.desde)) / 60;
        return (
          <li
            key={t.desde}
            className="regla__tramo"
            data-hueco={t.franja ? undefined : true}
            style={{ "--ancho": `${ancho}%` } as CSSProperties}
          >
            <p className="regla__horas cifras">
              {horaCorta(t.desde)} a {horaCorta(t.hasta)}
            </p>
            {t.franja ? (
              <>
                <h3 className="regla__nombre">{t.franja.name}</h3>
                <p className="regla__precio cifras">{pesos(t.franja.price)}</p>
                <p className="regla__unidad">
                  {t.franja.unit === "bloque"
                    ? `las ${horasTramo === 1 ? "una hora" : `${horasTramo} horas`}`
                    : "la hora"}
                </p>
              </>
            ) : (
              <>
                <h3 className="regla__nombre">Entre franjas</h3>
                <p className="regla__unidad">Tarifa por confirmar con el club</p>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
