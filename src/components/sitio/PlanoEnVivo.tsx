"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Plano } from "@/components/plano/Plano";
import { apiPublica } from "@/lib/api";
import { fichasDelDia, libreA } from "@/lib/fichas";
import { ahoraEnElClub, fechaLarga, horaCorta, hora12, nombreDia, partesFecha, sumarDias } from "@/lib/formato";
import type { Club, Dia } from "@/lib/tipos";

/* El plano de la portada, con la disponibilidad real de hoy.
 *
 * Responde la primera pregunta de quien llega: ¿hay mesa? Se elige una hora y el plano marca las
 * mesas libres a esa hora; tocar una lleva directo a reservarla. Si hoy ya no queda nada (es tarde
 * o es domingo), muestra el próximo día que abre. */

function cuandoEs(dia: Dia, hoy: string) {
  if (dia.date === hoy) return "Hoy";
  if (dia.date === sumarDias(hoy, 1)) return "Mañana";
  const n = nombreDia(partesFecha(dia.date).semana);
  return `El ${n}`;
}

export function PlanoEnVivo({ club }: { club: Club }) {
  const router = useRouter();
  const [dia, setDia] = useState<Dia | null>(null);
  const [hoy, setHoy] = useState("");
  const [hora, setHora] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const control = new AbortController();
    const { fecha } = ahoraEnElClub();

    // Busca el primer día, desde hoy, que todavía tenga horas reservables.
    (async () => {
      try {
        for (let i = 0; i < 8; i++) {
          const d = await apiPublica.dia(sumarDias(fecha, i), control.signal);
          const quedan = !d.closed && d.tables.some((t) => t.free > 0);
          if (quedan || i === 7) {
            const primera = d.times.find((t) => d.tables.some((m) => libreA(m, t))) ?? null;
            setHoy(fecha);
            setDia(d);
            setHora(primera);
            return;
          }
        }
      } catch {
        if (!control.signal.aborted) setFallo(true);
      }
    })();
    return () => control.abort();
  }, []);

  const horasConMesa = useMemo(
    () => (dia ? dia.times.filter((t) => dia.tables.some((m) => m.slots.find((s) => s.time === t)?.status !== "pasada")) : []),
    [dia],
  );
  const libres = dia && hora ? dia.tables.filter((m) => libreA(m, hora)).length : 0;
  const fichas = fichasDelDia(club.tables, dia, hora);

  const elegir = (mesa: number) => {
    if (!dia) {
      router.push("/reservar");
      return;
    }
    const q = new URLSearchParams({ fecha: dia.date, mesa: String(mesa) });
    if (hora && libreA(dia.tables.find((t) => t.tableId === mesa), hora)) q.set("hora", hora);
    router.push(`/reservar?${q.toString()}`);
  };

  return (
    <div className="envivo">
      <div className="envivo__cabeza">
        <p className="envivo__titulo" aria-live="polite">
          {fallo
            ? "Mira la disponibilidad en el plano de reservas"
            : !dia
              ? "Consultando las mesas…"
              : !hora
                ? `${cuandoEs(dia, hoy)} ya no quedan horas libres`
                : `${cuandoEs(dia, hoy)} a las ${hora12(hora)}: ${libres === 1 ? "1 mesa libre" : `${libres} mesas libres`}`}
        </p>
        {dia && !dia.isToday ? <p className="envivo__nota">{fechaLarga(dia.date)}</p> : null}
      </div>

      {horasConMesa.length > 0 ? (
        <div className="envivo__horas" role="group" aria-label="Elige una hora">
          {horasConMesa.map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed={hora === t}
              onClick={() => setHora(t)}
            >
              {horaCorta(t)}
            </button>
          ))}
        </div>
      ) : null}

      <Plano
        fichas={fichas}
        elementos={club.settings.floorPlan}
        onElegir={elegir}
        etiqueta="Plano del salón con las doce mesas. Toca una para reservarla."
      />

      <p className="envivo__pie">
        Toca una mesa para reservarla, o{" "}
        <Link className="enlace" href="/reservar">
          abre el plano completo
        </Link>
        .
      </p>
    </div>
  );
}
