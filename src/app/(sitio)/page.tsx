import Image from "next/image";
import Link from "next/link";

import { IconoWhatsApp } from "@/components/sitio/Iconos";
import { Movimiento } from "@/components/sitio/Movimiento";
import { PlanoEnVivo } from "@/components/sitio/PlanoEnVivo";
import { ReglaTarifas } from "@/components/sitio/ReglaTarifas";
import { TresBandas } from "@/components/sitio/TresBandas";
import { horarioAgrupado } from "@/components/sitio/horario";
import { cargarClub, enlaceWhatsApp } from "@/lib/club";
import { hora12, pesos } from "@/lib/formato";
import { FOTOS, type Foto } from "@/lib/fotos";
import type { CSSProperties } from "react";

const orden = (n: number) => ({ "--orden": n }) as CSSProperties;

function Fotografia({ foto, sizes, className }: { foto: Foto; sizes: string; className?: string }) {
  return (
    <figure className={`foto ${className ?? ""}`}>
      <Image src={foto.src} alt={foto.alt} fill sizes={sizes} />
    </figure>
  );
}

export default async function Portada() {
  const { club } = await cargarClub();
  const s = club.settings;
  const grupos = horarioAgrupado(club.hours);
  const abierto = grupos.find((g) => !g.cerrado);
  const cierreTexto = abierto ? (abierto.cierra === "24:00" ? "medianoche" : hora12(abierto.cierra)) : "";
  const domingo = club.hours.find((h) => h.weekday === 0);
  const mañana = club.rates.find((r) => r.unit === "bloque");
  const abreDia = abierto?.abre ?? "09:00";
  const cierraDia = abierto?.cierra ?? "24:00";
  const waTorneos = enlaceWhatsApp(s.whatsapp, "Hola Club 8, quiero información de los torneos y de alquilar el club para un evento.");
  const waGeneral = enlaceWhatsApp(s.whatsapp, "Hola Club 8, tengo una pregunta.");

  const preguntas: Array<{ p: string; r: string }> = [
    {
      p: "¿Cómo separo la mesa?",
      r: `Elige el día, la mesa y la hora en el plano. La reserva queda pendiente hasta que nos envías por WhatsApp el comprobante del anticipo: el valor de una hora de la franja${mañana ? ` (en la mañana, el plan de ${pesos(mañana.price)})` : ""}. Al recibirlo te la confirmamos.`,
    },
    {
      p: "¿Cuántas personas pueden jugar en una mesa?",
      r: `Hasta ${s.maxPlayers} por mesa. Si vienen más, reserva dos mesas o escríbenos.`,
    },
    {
      p: "¿Cuánto tiempo puedo reservar?",
      r: `De ${s.minHours} a ${s.maxHours} horas seguidas desde la web. Para una jornada más larga o un grupo grande, escríbenos por WhatsApp.`,
    },
    {
      p: "¿Puedo cancelar o cambiar la hora?",
      r: `Sí. En Mi reserva, con tu código y tu celular, puedes cancelar hasta ${s.cancelHours} horas antes. Para cambiar la hora o si ya pasó ese plazo, escríbenos por WhatsApp.`,
    },
    ...(domingo?.closed && abierto
      ? [{ p: "¿Abren los domingos?", r: `No. Abrimos ${abierto.dias.toLowerCase()}, de ${hora12(abierto.abre)} a ${cierreTexto}.` }]
      : []),
    ...(s.parking ? [{ p: "¿Hay parqueadero?", r: "Sí, el club tiene parqueadero privado." }] : []),
  ];

  return (
    <>
      <Movimiento />

      {/* ── Portada: qué es, dónde y si hay mesa ahora ───────────────────────── */}
      <section className="portada" aria-labelledby="titular">
        <div className="portada__texto">
          <h1 id="titular" className="portada__titular entra">
            Doce mesas Jimar en Chapinero
          </h1>
          <div className="portada__bajada">
            <p className="entra" style={orden(1)}>
              Tres bandas {abierto ? `${abierto.dias.toLowerCase()}, de ${hora12(abierto.abre)} a ${cierreTexto}` : ""}. Mira
              el plano, elige tu mesa y sepárala en un minuto.
            </p>
            <div className="portada__acciones entra" style={orden(2)}>
              <Link href="/reservar" className="boton boton--grande">
                Reservar mesa
              </Link>
              <p className="portada__direccion">
                {s.address} · {s.neighborhood}
              </p>
            </div>
          </div>
        </div>

        <div className="portada__escena">
          <div className="portada__plano entra" style={orden(2)}>
            <PlanoEnVivo club={club} />
          </div>
          <Fotografia foto={FOTOS.salon} sizes="(max-width: 900px) 100vw, 40vw" className="portada__foto entra" />
        </div>
      </section>

      {/* ── Las mesas ─────────────────────────────────────────────────────────── */}
      <section id="mesas" className="mesas" aria-labelledby="t-mesas">
        <Fotografia foto={FOTOS.mesa} sizes="(max-width: 900px) 100vw, 50vw" className="mesas__foto entra" />
        <div className="mesas__texto">
          <h2 id="t-mesas" className="titulo-seccion entra">
            Mesas de competición
          </h2>
          <p className="afirmacion entra" style={orden(1)}>
            Las doce son Jimar modelo 2026, con mantenimiento diario para que la bola ruede igual en la primera partida de la
            mañana y en la última de la noche.
          </p>
          <dl className="mesas__datos entra" style={orden(2)}>
            <div>
              <dt>Pizarra calefaccionada</dt>
              <dd>La temperatura del paño no cambia con el clima de Bogotá.</dd>
            </div>
            <div>
              <dt>Paño de alta velocidad</dt>
              <dd>Rodamiento parejo en las líneas largas de tres bandas.</dd>
            </div>
            <div>
              <dt>Bandas de rebote preciso</dt>
              <dd>Respuesta uniforme, a la altura de un torneo oficial.</dd>
            </div>
            <div>
              <dt>Luz puntual sobre el paño</dt>
              <dd>Sin sombras en el recorrido de la bola.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── Tarifas ───────────────────────────────────────────────────────────── */}
      <section id="tarifas" className="tarifas" aria-labelledby="t-tarifas">
        <div className="tarifas__cabeza">
          <h2 id="t-tarifas" className="titulo-seccion entra">
            Cada franja, su precio
          </h2>
          <p className="afirmacion entra" style={orden(1)}>
            Separas la mesa con el valor de una hora{mañana ? "; en la mañana, con el plan completo" : ""}. El resto se paga
            en el club.
          </p>
        </div>
        <div className="entra" style={orden(2)}>
          <ReglaTarifas franjas={club.rates} abre={abreDia} cierra={cierraDia} />
        </div>
      </section>

      {/* ── Cómo reservar ─────────────────────────────────────────────────────── */}
      <section className="como" aria-labelledby="t-como">
        <div className="como__texto">
          <h2 id="t-como" className="titulo-seccion entra">
            Tres toques y reservaste
          </h2>
          <ol className="como__pasos">
            <li className="entra" style={orden(1)}>
              <strong>Elige el día</strong> en el calendario. El plano te muestra cuántas horas libres tiene cada mesa.
            </li>
            <li className="entra" style={orden(2)}>
              <strong>Toca la mesa</strong> que quieras y escoge la hora de inicio y cuántas horas vas a jugar.
            </li>
            <li className="entra" style={orden(3)}>
              <strong>Sepárala con el anticipo</strong> por WhatsApp. Te confirmamos y la mesa queda a tu nombre.
            </li>
          </ol>
          <Link href="/reservar" className="boton entra" style={orden(4)}>
            Empezar la reserva
          </Link>
        </div>
        <div className="como__dibujo entra" style={orden(1)}>
          <TresBandas />
        </div>
      </section>

      {/* ── Piso 5 ────────────────────────────────────────────────────────────── */}
      <section className="piso5" aria-labelledby="t-piso5">
        <div className="piso5__texto">
          <h2 id="t-piso5" className="titulo-seccion entra">
            Después de la partida
          </h2>
          <p className="afirmacion entra" style={orden(1)}>
            En el piso 5 está el café bar, con coctelería clásica para la barra o la mesa, y una terraza con vista sobre la
            ciudad.
          </p>
        </div>
        <div className="piso5__mosaico">
          <Fotografia foto={FOTOS.grupo} sizes="(max-width: 900px) 100vw, 50vw" className="piso5__grande entra" />
          <Fotografia foto={FOTOS.mesaCafe} sizes="(max-width: 900px) 50vw, 25vw" className="entra" />
          <Fotografia foto={FOTOS.musica} sizes="(max-width: 900px) 50vw, 25vw" className="entra" />
          <Fotografia foto={FOTOS.cartas} sizes="(max-width: 900px) 50vw, 25vw" className="entra" />
          <Fotografia foto={FOTOS.risa} sizes="(max-width: 900px) 50vw, 25vw" className="entra" />
        </div>
      </section>

      {/* ── Torneos y eventos ─────────────────────────────────────────────────── */}
      <section className="torneos" aria-labelledby="t-torneos">
        <div className="torneos__texto">
          <h2 id="t-torneos" className="titulo-seccion entra">
            Torneos cada mes
          </h2>
          <p className="afirmacion entra" style={orden(1)}>
            Inscríbete en el torneo mensual o alquila el club completo para tu evento privado o de empresa.
          </p>
          {waTorneos ? (
            <a className="boton boton--negro entra" style={orden(2)} href={waTorneos} target="_blank" rel="noreferrer">
              <IconoWhatsApp /> Preguntar por WhatsApp
            </a>
          ) : null}
        </div>
        <div className="torneos__fotos">
          <Fotografia foto={FOTOS.amarillo} sizes="(max-width: 900px) 100vw, 30vw" className="entra" />
          <Fotografia foto={FOTOS.traje} sizes="(max-width: 900px) 100vw, 30vw" className="entra" />
        </div>
      </section>

      {/* ── Ubicación ─────────────────────────────────────────────────────────── */}
      <section id="ubicacion" className="ubicacion" aria-labelledby="t-ubicacion">
        <Fotografia foto={FOTOS.edificio} sizes="(max-width: 900px) 100vw, 45vw" className="ubicacion__foto entra" />
        <div className="ubicacion__texto">
          <h2 id="t-ubicacion" className="titulo-seccion entra">
            {s.address}
          </h2>
          <p className="afirmacion entra" style={orden(1)}>
            {s.neighborhood}, {s.city}.{s.parking ? " Con parqueadero privado." : ""}
          </p>
          <table className="ubicacion__horario entra" style={orden(2)}>
            <caption className="solo-lector">Horario de atención</caption>
            <tbody>
              {grupos.map((g) => (
                <tr key={g.dias}>
                  <th scope="row">{g.dias}</th>
                  <td className="cifras">{g.cerrado ? "Cerrado" : `${hora12(g.abre)} a ${hora12(g.cierra)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ubicacion__acciones entra" style={orden(3)}>
            {s.mapsUrl ? (
              <a className="boton" href={s.mapsUrl} target="_blank" rel="noreferrer">
                Cómo llegar
              </a>
            ) : null}
            {waGeneral ? (
              <a className="boton boton--sobrio" href={waGeneral} target="_blank" rel="noreferrer">
                <IconoWhatsApp /> {s.phoneDisplay}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Preguntas ─────────────────────────────────────────────────────────── */}
      <section className="preguntas" aria-labelledby="t-preguntas">
        <h2 id="t-preguntas" className="titulo-seccion entra">
          Antes de venir
        </h2>
        <div className="preguntas__lista">
          {preguntas.map((q, i) => (
            <details key={q.p} className="pregunta entra" style={orden(i)}>
              <summary>{q.p}</summary>
              <p>{q.r}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
