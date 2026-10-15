"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";

import { Plano } from "@/components/plano/Plano";
import { ErrorAPI, apiPublica, mensajeDe } from "@/lib/api";
import { fichasDelDia, horasLibres, libreA } from "@/lib/fichas";
import { ahoraEnElClub, fechaLarga, hora12, horaCorta, horas as textoHoras, minutos, pesos, sumarDias } from "@/lib/formato";
import { anticipoDe, franjasDelTramo } from "@/lib/tarifas";
import type { Club, Dia, ReservaPublica, ResumenDia } from "@/lib/tipos";

import { AgendaMesa, horasSeguidasLibres } from "./AgendaMesa";
import { Calendario } from "./Calendario";
import { FichaReserva } from "./FichaReserva";
import { TiraFechas } from "./TiraFechas";

/* ─────────────────────────────────────────────────────────────────────────────
   La reserva en una sola pantalla.

   Arriba el día; en el centro el plano del salón con cuántas horas le quedan a cada mesa; al tocar
   una mesa, a su lado, sus horas de ese día. Se elige la hora de inicio y cuántas horas, se dejan
   el nombre y el celular, y listo. Lo elegido viaja en la URL, así que se puede compartir o volver
   atrás sin perderlo.
   ───────────────────────────────────────────────────────────────────────────── */

type Inicial = { fecha?: string; mesa?: number; hora?: string };
type Datos = { nombre: string; celular: string; jugadores: number; correo: string; notas: string };

const CLAVE_DATOS = "c8-datos-cliente";

function leerDatosGuardados(): Partial<Datos> {
  try {
    return JSON.parse(window.localStorage.getItem(CLAVE_DATOS) ?? "{}") as Partial<Datos>;
  } catch {
    return {};
  }
}

export function Reservador({ club, inicial }: { club: Club; inicial: Inicial }) {
  const s = club.settings;
  // La fecha del club se calcula igual en el servidor y en el navegador: es el mismo instante en
  // la misma zona horaria, así que el primer pintado y la hidratación coinciden.
  const [hoy] = useState(() => ahoraEnElClub().fecha);
  const [dias, setDias] = useState<ResumenDia[]>([]);
  const [fecha, setFecha] = useState(() => (inicial.fecha && inicial.fecha >= hoy ? inicial.fecha : hoy));
  const [dia, setDia] = useState<Dia | null>(null);
  const [errorDia, setErrorDia] = useState("");
  const [verCalendario, setVerCalendario] = useState(false);

  // La URL trae el número de la mesa (el que ve el cliente); aquí se trabaja con su id.
  const [mesaId, setMesaId] = useState<number | null>(
    () => club.tables.find((t) => t.number === inicial.mesa)?.id ?? null,
  );
  const [inicio, setInicio] = useState<string | null>(inicial.hora ?? null);
  const [horas, setHoras] = useState(Math.max(s.minHours, Math.min(2, s.maxHours)));
  const [filtroHora, setFiltroHora] = useState<string | null>(null);

  const [paso, setPaso] = useState<"elegir" | "datos">("elegir");
  // Los datos de una reserva anterior en este navegador. El formulario no se pinta en el primer
  // render, así que leerlos aquí no descuadra la hidratación.
  const [datos, setDatos] = useState<Datos>(() => ({
    nombre: "",
    celular: "",
    jugadores: 2,
    correo: "",
    ...leerDatosGuardados(),
    notas: "",
  }));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reserva, setReserva] = useState<ReservaPublica | null>(null);

  const panel = useRef<HTMLDivElement>(null);
  const [recarga, setRecarga] = useState(0);

  // ── La fecha del club y los días de la agenda ─────────────────────────────
  useEffect(() => {
    const control = new AbortController();
    apiPublica
      .dias(hoy, Math.min(62, s.horizonDays + 1), control.signal)
      .then((lista) => {
        setDias(lista);
        // Si el día pedido está cerrado, se salta al primero que abre.
        setFecha((actual) => {
          const elegido = lista.find((d) => d.date === actual);
          if (elegido && !elegido.closed) return actual;
          return lista.find((d) => !d.closed && d.date >= actual)?.date ?? actual;
        });
      })
      .catch(() => {
        /* sin la tira de días el plano sigue funcionando con la fecha elegida */
      });
    return () => control.abort();
  }, [hoy, s.horizonDays]);

  // ── La disponibilidad del día elegido ─────────────────────────────────────
  useEffect(() => {
    const control = new AbortController();
    apiPublica
      .dia(fecha, control.signal)
      .then((d) => {
        setDia(d);
        setErrorDia("");
      })
      .catch((e) => {
        if (!control.signal.aborted) setErrorDia(mensajeDe(e));
      });
    return () => control.abort();
  }, [fecha, recarga]);

  const agenda = useMemo(() => (dia && mesaId ? dia.tables.find((t) => t.tableId === mesaId) ?? null : null), [dia, mesaId]);
  const mesa = club.tables.find((t) => t.id === mesaId) ?? null;

  // Lo elegido sólo vale mientras siga libre: si otra persona tomó la hora, o se cambió de día,
  // la hora de inicio se suelta y la duración se recorta a lo que cabe. Se deriva en cada render
  // en vez de corregirse en un efecto.
  const libresDesdeInicio = agenda && inicio ? horasSeguidasLibres(agenda, inicio) : 0;
  const inicioOk = libresDesdeInicio > 0 ? inicio : null;
  const horasOk = inicioOk ? Math.max(s.minHours, Math.min(horas, libresDesdeInicio)) : horas;

  // ── La URL refleja lo elegido ─────────────────────────────────────────────
  useEffect(() => {
    const q = new URLSearchParams();
    if (fecha) q.set("fecha", fecha);
    if (mesaId) q.set("mesa", String(club.tables.find((t) => t.id === mesaId)?.number ?? mesaId));
    if (inicioOk) q.set("hora", inicioOk);
    window.history.replaceState(null, "", `?${q.toString()}`);
  }, [fecha, mesaId, inicioOk, club.tables]);

  const elegirFecha = useCallback((f: string) => {
    setFecha(f);
    setInicio(null);
    setFiltroHora(null);
    setPaso("elegir");
    setVerCalendario(false);
  }, []);

  const elegirMesa = (id: number) => {
    setMesaId(id);
    setPaso("elegir");
    const ag = dia?.tables.find((t) => t.tableId === id);
    if (filtroHora && ag && libreA(ag, filtroHora)) setInicio(filtroHora);
    else setInicio(null);
    // En el teléfono el panel queda debajo del plano: se trae a la vista.
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const horasDelFiltro = useMemo(
    () => (dia ? dia.times.filter((t) => dia.tables.some((m) => m.slots.find((x) => x.time === t)?.status !== "pasada")) : []),
    [dia],
  );
  const fichas = fichasDelDia(club.tables, dia, filtroHora);
  const libresConFiltro = dia && filtroHora ? dia.tables.filter((m) => libreA(m, filtroHora)).length : null;

  const fin = inicioOk ? hhmmMas(inicioOk, horasOk) : null;
  const tarifas = inicioOk ? franjasDelTramo(club.rates, inicioOk, horasOk) : [];
  const anticipo = inicioOk ? anticipoDe(club.rates, inicioOk) : null;

  // ── Enviar ────────────────────────────────────────────────────────────────
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!mesaId || !inicioOk) return;
    setEnviando(true);
    setErrores({});
    setErrorGeneral("");
    try {
      const r = await apiPublica.reservar({
        tableId: mesaId,
        date: fecha,
        time: inicioOk,
        hours: horasOk,
        partySize: datos.jugadores,
        name: datos.nombre,
        phone: datos.celular,
        email: datos.correo,
        notes: datos.notas,
      });
      try {
        window.localStorage.setItem(
          CLAVE_DATOS,
          JSON.stringify({ nombre: datos.nombre, celular: datos.celular, correo: datos.correo }),
        );
      } catch {
        /* recordar los datos es una comodidad, no un requisito */
      }
      setReserva(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ErrorAPI && err.campos) {
        setErrores(err.campos);
        if (err.campos.time || err.campos.tableId || err.campos.hours || err.campos.date) {
          setErrorGeneral(err.campos.time ?? err.campos.hours ?? err.campos.date ?? err.campos.tableId ?? "");
        }
      } else if (err instanceof ErrorAPI && err.esConflicto) {
        setErrorGeneral(`${err.message} Te mostramos la disponibilidad actualizada.`);
        setPaso("elegir");
        setRecarga((n) => n + 1);
      } else {
        setErrorGeneral(mensajeDe(err));
      }
    } finally {
      setEnviando(false);
    }
  };

  // ── Reserva hecha ─────────────────────────────────────────────────────────
  if (reserva) {
    return (
      <div className="reservada">
        <h1 className="interior__titulo">Tu mesa está apartada</h1>
        <p className="interior__bajada">
          Te esperamos el {fechaLarga(reserva.date)} a las {hora12(reserva.time)} en {s.address}.
        </p>
        <FichaReserva
          reserva={reserva}
          acciones={
            <>
              <Link className="boton boton--sobrio" href="/mi-reserva">
                Ver mi reserva
              </Link>
              <button
                type="button"
                className="boton boton--sobrio"
                onClick={() => {
                  setReserva(null);
                  setInicio(null);
                  setPaso("elegir");
                  setRecarga((n) => n + 1);
                }}
              >
                Reservar otra mesa
              </button>
            </>
          }
        />
      </div>
    );
  }

  const cuandoTexto = fecha === hoy ? "hoy" : fecha === sumarDias(hoy, 1) ? "mañana" : `el ${fechaLarga(fecha)}`;

  return (
    <div className="reservador">
      <div className="reservador__cabeza">
        <h1 className="interior__titulo">Reserva tu mesa</h1>
        <p className="interior__bajada">Elige el día, toca una mesa en el plano y escoge tus horas.</p>
      </div>

      {/* ── El día ── */}
      <section className="reservador__dias" aria-labelledby="t-dia">
        <div className="reservador__fila">
          <h2 id="t-dia" className="reservador__subtitulo">
            {fecha ? fechaLarga(fecha).replace(/^./, (c) => c.toUpperCase()) : "Elige el día"}
          </h2>
          <button
            type="button"
            className="boton boton--sobrio"
            aria-expanded={verCalendario}
            onClick={() => setVerCalendario((v) => !v)}
          >
            {verCalendario ? "Cerrar calendario" : "Ver calendario"}
          </button>
        </div>
        {verCalendario && dias.length > 0 ? <Calendario dias={dias} fecha={fecha} onElegir={elegirFecha} /> : null}
        {dias.length > 0 ? <TiraFechas dias={dias} fecha={fecha} hoy={hoy} onElegir={elegirFecha} /> : null}
      </section>

      <div className="reservador__cuerpo">
        {/* ── El plano ── */}
        <section className="reservador__plano" aria-labelledby="t-plano">
          <h2 id="t-plano" className="solo-lector">
            Plano del salón
          </h2>
          {horasDelFiltro.length > 0 ? (
            <div className="reservador__filtro">
              <p className="reservador__pregunta">
                {filtroHora
                  ? `${libresConFiltro === 1 ? "1 mesa libre" : `${libresConFiltro} mesas libres`} a las ${hora12(filtroHora)}`
                  : "¿Ya sabes a qué hora? Marca las mesas libres"}
              </p>
              <div className="envivo__horas" role="group" aria-label="Filtrar por hora">
                <button type="button" className="chip" aria-pressed={filtroHora === null} onClick={() => setFiltroHora(null)}>
                  Todas
                </button>
                {horasDelFiltro.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="chip"
                    aria-pressed={filtroHora === t}
                    onClick={() => {
                      setFiltroHora(t);
                      if (agenda && libreA(agenda, t)) setInicio(t);
                    }}
                  >
                    {horaCorta(t)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Plano
            fichas={fichas}
            elementos={s.floorPlan}
            seleccionada={mesaId}
            onElegir={elegirMesa}
            etiqueta={`Plano del salón ${cuandoTexto}. Toca una mesa para ver sus horas.`}
            pie={
              <>
                <span className="leyenda">Muchas horas libres</span>
                <span className="leyenda" style={{ "--muestra": "var(--pano)" } as CSSProperties}>
                  Pocas horas
                </span>
                <span className="leyenda" style={{ "--muestra": "var(--pano-apagado)" } as CSSProperties}>
                  Sin horas libres
                </span>
                <span className="leyenda" style={{ "--muestra": "var(--humo)" } as CSSProperties}>
                  No disponible
                </span>
              </>
            }
          />
          {errorDia ? (
            <p className="aviso" role="alert">
              {errorDia}{" "}
              <button type="button" className="enlace boton-texto" onClick={() => setRecarga((n) => n + 1)}>
                Intentar de nuevo
              </button>
            </p>
          ) : null}
          {dia?.closed ? <p className="aviso">Ese día el club está cerrado. Elige otro en la tira de fechas.</p> : null}
        </section>

        {/* ── La mesa elegida ── */}
        <aside ref={panel} className="reservador__panel" aria-labelledby="t-panel" aria-live="polite">
          {!mesa || !agenda ? (
            <div className="panel-vacio">
              <h2 id="t-panel" className="reservador__subtitulo">
                Toca una mesa
              </h2>
              <p>
                Las doce son Jimar de tres bandas. Bajo cada una ves cuántas horas le quedan libres {cuandoTexto}; al tocarla
                aparecen sus horas aquí.
              </p>
            </div>
          ) : paso === "elegir" ? (
            <div className="panel-mesa">
              <div className="panel-mesa__cabeza">
                <h2 id="t-panel" className="reservador__subtitulo">
                  {mesa.name}
                </h2>
                <p className="panel-mesa__detalle">
                  {mesa.detail} · {horasLibres(agenda.free)} {cuandoTexto}
                </p>
              </div>

              {agenda.free === 0 ? (
                <p className="aviso">Esta mesa no tiene horas libres {cuandoTexto}. Prueba con otra mesa u otro día.</p>
              ) : null}

              <AgendaMesa
                agenda={agenda}
                inicio={inicioOk}
                horas={horasOk}
                minimo={s.minHours}
                maximo={s.maxHours}
                onInicio={(t) => {
                  setInicio(t);
                  setHoras((h) => Math.max(s.minHours, Math.min(h, horasSeguidasLibres(agenda, t), s.maxHours)));
                }}
                onHoras={(n) => setHoras(Math.max(s.minHours, Math.min(n, s.maxHours)))}
              />

              {inicioOk && fin ? (
                <div className="resumen">
                  <p className="resumen__tramo cifras">
                    {hora12(inicioOk)} a {hora12(fin)}
                  </p>
                  <ul className="resumen__tarifas">
                    {tarifas.map((t) => (
                      <li key={t.nombre}>
                        {t.nombre}: {t.precio}
                      </li>
                    ))}
                  </ul>
                  <p className="resumen__anticipo">
                    {anticipo
                      ? `Para separarla: ${pesos(anticipo.valor)}, ${anticipo.texto}.`
                      : "El anticipo de esta hora te lo confirmamos por WhatsApp."}
                  </p>
                  <button type="button" className="boton boton--grande resumen__seguir" onClick={() => setPaso("datos")}>
                    Continuar
                  </button>
                </div>
              ) : agenda.free > 0 ? (
                <p className="panel-mesa__ayuda">Toca la hora en la que quieres empezar.</p>
              ) : null}
            </div>
          ) : (
            <form className="datos" onSubmit={enviar} noValidate>
              <button type="button" className="enlace boton-texto datos__volver" onClick={() => setPaso("elegir")}>
                Cambiar mesa u hora
              </button>
              <h2 id="t-panel" className="reservador__subtitulo">
                Tus datos
              </h2>
              <p className="datos__resumen cifras">
                {mesa.name} · {fechaLarga(fecha)} · {inicioOk ? `${hora12(inicioOk)} a ${hora12(fin ?? inicioOk)}` : ""} ·{" "}
                {textoHoras(horasOk)}
              </p>

              <div className="campo">
                <label className="campo__etiqueta" htmlFor="r-nombre">
                  Nombre
                </label>
                <input
                  id="r-nombre"
                  className="entrada"
                  autoComplete="name"
                  value={datos.nombre}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                  aria-invalid={!!errores.name || undefined}
                  aria-describedby={errores.name ? "e-nombre" : undefined}
                  required
                />
                {errores.name ? (
                  <p id="e-nombre" className="campo__error">
                    {errores.name}
                  </p>
                ) : null}
              </div>

              <div className="campo">
                <label className="campo__etiqueta" htmlFor="r-celular">
                  Celular con WhatsApp
                </label>
                <input
                  id="r-celular"
                  className="entrada cifras"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="301 641 4894"
                  value={datos.celular}
                  onChange={(e) => setDatos({ ...datos, celular: e.target.value })}
                  aria-invalid={!!errores.phone || undefined}
                  aria-describedby={errores.phone ? "e-celular" : "a-celular"}
                  required
                />
                {errores.phone ? (
                  <p id="e-celular" className="campo__error">
                    {errores.phone}
                  </p>
                ) : (
                  <p id="a-celular" className="campo__ayuda">
                    Por aquí te confirmamos la reserva.
                  </p>
                )}
              </div>

              <fieldset className="campo campo--grupo">
                <legend className="campo__etiqueta">¿Cuántos juegan?</legend>
                <div className="segmentos">
                  {Array.from({ length: s.maxPlayers }, (_, i) => i + 1).map((n) => (
                    <label key={n} className="segmento">
                      <input
                        type="radio"
                        name="jugadores"
                        value={n}
                        checked={datos.jugadores === n}
                        onChange={() => setDatos({ ...datos, jugadores: n })}
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
                {errores.partySize ? <p className="campo__error">{errores.partySize}</p> : null}
              </fieldset>

              <div className="campo">
                <label className="campo__etiqueta" htmlFor="r-correo">
                  Correo <span className="campo__ayuda">(opcional)</span>
                </label>
                <input
                  id="r-correo"
                  className="entrada"
                  type="email"
                  autoComplete="email"
                  value={datos.correo}
                  onChange={(e) => setDatos({ ...datos, correo: e.target.value })}
                  aria-invalid={!!errores.email || undefined}
                />
                {errores.email ? <p className="campo__error">{errores.email}</p> : null}
              </div>

              <div className="campo">
                <label className="campo__etiqueta" htmlFor="r-notas">
                  ¿Algo que debamos saber? <span className="campo__ayuda">(opcional)</span>
                </label>
                <textarea
                  id="r-notas"
                  className="entrada"
                  value={datos.notas}
                  maxLength={500}
                  onChange={(e) => setDatos({ ...datos, notas: e.target.value })}
                />
              </div>

              {errorGeneral ? (
                <p className="aviso" role="alert">
                  {errorGeneral}
                </p>
              ) : null}

              <button type="submit" className="boton boton--grande" disabled={enviando}>
                {enviando ? "Reservando…" : "Confirmar reserva"}
              </button>
              <p className="campo__ayuda">
                La reserva queda pendiente hasta que envíes el anticipo. Puedes cancelarla desde la web hasta {s.cancelHours}{" "}
                horas antes.
              </p>
            </form>
          )}
          {errorGeneral && paso === "elegir" ? (
            <p className="aviso" role="alert">
              {errorGeneral}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function hhmmMas(inicio: string, horas: number) {
  const m = minutos(inicio) + horas * 60;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
