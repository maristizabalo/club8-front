"use client";

import { useMemo, useState, type CSSProperties } from "react";

import { Plano, type FichaPlano } from "@/components/plano/Plano";
import { api } from "@/lib/api";
import { horasLibres } from "@/lib/fichas";
import {
  ahoraEnElClub,
  fechaLarga,
  hora12,
  horaCorta,
  horaDeInstante,
  minutos,
  sumarDias,
  transcurrido,
} from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import type { MesaPanel, MotivoBloqueo, Reserva, VistaPanel } from "@/lib/tipos";

import { CajonReserva } from "./CajonReserva";
import { ESTADO, MOTIVOS, textoMotivo } from "./estados";
import { useAccion, useAhora, useCarga } from "./ganchos";
import { NuevaReserva, type Prellenado } from "./NuevaReserva";

/* ─────────────────────────────────────────────────────────────────────────────
   El salón de un vistazo.

   Dos canales que nunca se mezclan, como en Master Club: AHORA (quién está jugando, qué mesa está
   bloqueada) y DESPUÉS (la próxima reserva de cada mesa y la agenda del día). Una mesa puede estar
   libre ahora y tener reserva a las 20:00; una mesa en juego conserva la reserva que tiene después,
   y si esa reserva se acerca, la mesa avisa.
   ───────────────────────────────────────────────────────────────────────────── */

const primerNombre = (n: string) => n.split(" ")[0] ?? n;

function fichasPanel(v: VistaPanel, ahora: number): FichaPlano[] {
  return v.tables.map((bt) => {
    const t = bt.table;
    const base: FichaPlano = {
      id: t.id,
      numero: t.number,
      nombre: t.name,
      x: t.mapX,
      y: t.mapY,
      vertical: t.rotation === 90,
      tono: "vivo",
      alerta: !!bt.alert,
    };
    if (bt.state === "FUERA_DE_SERVICIO") return { ...base, tono: "fuera", etiqueta: "Fuera de servicio" };
    if (!v.isToday) {
      const ag = v.agenda.tables.find((a) => a.tableId === t.id);
      const libres = ag?.free ?? 0;
      return { ...base, tono: libres === 0 ? "apagado" : "vivo", etiqueta: horasLibres(libres) };
    }
    if (bt.state === "EN_JUEGO" && bt.session) {
      return { ...base, bolas: true, tono: "hondo", etiqueta: `En juego · ${transcurrido(bt.session.startedAt, ahora)}` };
    }
    if (bt.state === "BLOQUEADA" && bt.block) {
      return { ...base, tono: "rayado", etiqueta: textoMotivo(bt.block.reason) };
    }
    return {
      ...base,
      etiqueta: bt.next ? `${horaCorta(bt.next.time)} · ${primerNombre(bt.next.customer.name)}` : "Libre",
    };
  });
}

export function PanelHoy() {
  const hoy = useMemo(() => ahoraEnElClub().fecha, []);
  const [fecha, setFecha] = useState(hoy);
  const { datos: v, error, recargar } = useCarga(() => api.panel(fecha), `panel-${fecha}`, 30000);
  const ahora = useAhora(30000);
  const [mesaId, setMesaId] = useState<number | null>(null);
  const [reservaId, setReservaId] = useState<number | null>(null);
  const [nueva, setNueva] = useState<Prellenado | null>(null);
  const { puede } = useSesion();

  const mesas = useMemo(() => v?.tables.map((t) => t.table) ?? [], [v]);
  const elegida = v?.tables.find((t) => t.table.id === mesaId) ?? null;

  return (
    <div className="pn-pagina">
      <header className="pn-cabeza">
        <div>
          <h1 className="pn-titulo">{fecha === hoy ? "Hoy" : fechaLarga(fecha).replace(/^./, (c) => c.toUpperCase())}</h1>
          <p className="pn-nota">{fecha === hoy ? fechaLarga(fecha) : "Agenda del día"}</p>
        </div>
        <div className="pn-cabeza__acciones">
          <div className="pn-fecha" role="group" aria-label="Cambiar de día">
            <button type="button" className="pn-boton" onClick={() => setFecha(sumarDias(fecha, -1))} aria-label="Día anterior">
              ←
            </button>
            <input
              className="entrada pn-fecha__entrada"
              type="date"
              value={fecha}
              onChange={(e) => e.target.value && setFecha(e.target.value)}
              aria-label="Fecha"
            />
            <button type="button" className="pn-boton" onClick={() => setFecha(sumarDias(fecha, 1))} aria-label="Día siguiente">
              →
            </button>
            {fecha !== hoy ? (
              <button type="button" className="pn-boton" onClick={() => setFecha(hoy)}>
                Hoy
              </button>
            ) : null}
          </div>
          {puede("gestionar:reservas") ? (
            <button type="button" className="pn-boton pn-boton--oro" onClick={() => setNueva({ date: fecha })}>
              Nueva reserva
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="aviso" role="alert">
          {error}
        </p>
      ) : null}

      {!v ? (
        <p className="pn-nota">Cargando el salón…</p>
      ) : (
        <>
          <dl className="pn-kpis">
            <div>
              <dt>Reservas del día</dt>
              <dd className="cifras">{v.kpis.reservations}</dd>
            </div>
            <div data-tono={v.kpis.pending > 0 ? "oro" : undefined}>
              <dt>Pendientes de anticipo</dt>
              <dd className="cifras">{v.kpis.pending}</dd>
            </div>
            {v.isToday ? (
              <>
                <div>
                  <dt>En juego</dt>
                  <dd className="cifras">
                    {v.kpis.inPlay}
                    <small>{v.kpis.playersNow} jugadores</small>
                  </dd>
                </div>
                <div>
                  <dt>Libres ahora</dt>
                  <dd className="cifras">{v.kpis.free}</dd>
                </div>
                <div>
                  <dt>No disponibles</dt>
                  <dd className="cifras">{v.kpis.blocked}</dd>
                </div>
              </>
            ) : null}
          </dl>

          <div className="pn-salon">
            <section className="pn-tarjeta pn-salon__plano" aria-label="Plano del salón">
              <Plano
                fichas={fichasPanel(v, ahora)}
                elementos={v.floorPlan}
                seleccionada={mesaId}
                onElegir={setMesaId}
                etiqueta="Plano del salón. Toca una mesa para ver sus acciones."
                pie={
                  <>
                    <span className="leyenda">Libre</span>
                    <span className="leyenda" style={{ "--muestra": "var(--pano)" } as CSSProperties}>
                      En juego
                    </span>
                    <span className="leyenda" style={{ "--muestra": "var(--humo)" } as CSSProperties}>
                      Bloqueada
                    </span>
                    <span className="leyenda" style={{ "--muestra": "var(--alerta)" } as CSSProperties}>
                      Reserva encima
                    </span>
                  </>
                }
              />
            </section>

            <aside className="pn-tarjeta pn-salon__mesa" aria-live="polite">
              {elegida ? (
                <MesaDetalle
                  key={elegida.table.id}
                  bt={elegida}
                  vista={v}
                  ahora={ahora}
                  onCambio={recargar}
                  onAbrirReserva={setReservaId}
                  onNueva={(p) => setNueva(p)}
                />
              ) : (
                <div className="pn-vacio">
                  <h2 className="pn-subtitulo">Toca una mesa</h2>
                  <p>Para ocuparla, finalizar el juego, bloquearla o ver sus reservas del día.</p>
                  {v.tables.some((t) => t.alert) ? (
                    <ul className="pn-alertas">
                      {v.tables
                        .filter((t) => t.alert)
                        .map((t) => (
                          <li key={t.table.id}>
                            <button type="button" className="boton-texto enlace" onClick={() => setMesaId(t.table.id)}>
                              {t.table.name}
                            </button>
                            : {t.alert}
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </aside>
          </div>

          <section className="pn-tarjeta" aria-labelledby="t-agenda">
            <h2 id="t-agenda" className="pn-subtitulo">
              Agenda del día
            </h2>
            <AgendaDia
              v={v}
              ahora={ahora}
              onAbrir={setReservaId}
              onLibre={(tableId, time) => puede("gestionar:reservas") && setNueva({ tableId, date: v.date, time })}
            />
          </section>

          <section className="pn-tarjeta" aria-labelledby="t-lista">
            <h2 id="t-lista" className="pn-subtitulo">
              Reservas del día
            </h2>
            <ListaDelDia reservas={v.reservations} onAbrir={setReservaId} />
          </section>
        </>
      )}

      <CajonReserva id={reservaId} mesas={mesas} onCerrar={() => setReservaId(null)} onCambio={recargar} />
      <NuevaReserva
        abierto={nueva !== null}
        mesas={mesas}
        fecha={fecha}
        prellenado={nueva ?? undefined}
        onCerrar={() => setNueva(null)}
        onCreada={() => {
          setNueva(null);
          recargar();
        }}
      />
    </div>
  );
}

// ── La mesa elegida ──────────────────────────────────────────────────────────

function MesaDetalle({
  bt,
  vista,
  ahora,
  onCambio,
  onAbrirReserva,
  onNueva,
}: {
  bt: MesaPanel;
  vista: VistaPanel;
  ahora: number;
  onCambio: () => void;
  onAbrirReserva: (id: number) => void;
  onNueva: (p: Prellenado) => void;
}) {
  const { puede } = useSesion();
  const accion = useAccion();
  const [cliente, setCliente] = useState("");
  const [jugadores, setJugadores] = useState(2);
  const [bloqueando, setBloqueando] = useState(false);
  const [motivo, setMotivo] = useState<MotivoBloqueo>("mantenimiento");
  const [notaBloqueo, setNotaBloqueo] = useState("");
  const [hasta, setHasta] = useState("");

  const t = bt.table;
  const opera = puede("operar:mesas") && vista.isToday;
  const delDia = vista.reservations.filter((r) => r.tableId === t.id);
  const activas = delDia.filter((r) => r.status === "PENDIENTE" || r.status === "CONFIRMADA");

  return (
    <div className="pn-mesa">
      <div className="pn-mesa__cabeza">
        <h2 className="pn-subtitulo">{t.name}</h2>
        <span className="pn-estado" data-estado={bt.state}>
          {bt.state === "LIBRE"
            ? "Libre"
            : bt.state === "EN_JUEGO"
              ? "En juego"
              : bt.state === "BLOQUEADA"
                ? "Bloqueada"
                : "Fuera de servicio"}
        </span>
      </div>

      {bt.alert ? <p className="pn-alerta">{bt.alert}</p> : null}

      {/* AHORA */}
      {vista.isToday && bt.session ? (
        <div className="pn-mesa__bloque">
          <p className="pn-reloj cifras">{transcurrido(bt.session.startedAt, ahora)}</p>
          <p>
            {bt.session.customerName || "Sin nombre"} · {bt.session.partySize} jugadores · desde las{" "}
            {horaDeInstante(bt.session.startedAt)}
          </p>
          {opera ? (
            <button
              type="button"
              className="pn-boton pn-boton--oro"
              disabled={accion.ocupado}
              onClick={() => accion.correr(() => api.finalizar(bt.session!.id), onCambio)}
            >
              Finalizar juego
            </button>
          ) : null}
        </div>
      ) : null}

      {vista.isToday && bt.block ? (
        <div className="pn-mesa__bloque">
          <p>
            <strong>{textoMotivo(bt.block.reason)}</strong>
            {bt.block.note ? ` · ${bt.block.note}` : ""}
          </p>
          <p className="pn-nota">
            {bt.block.endsAt ? `Hasta ${horaDeInstante(bt.block.endsAt)}` : "Sin fecha de fin"}
            {bt.block.createdByName ? ` · bloqueó ${bt.block.createdByName}` : ""}
          </p>
          {opera ? (
            <button
              type="button"
              className="pn-boton pn-boton--oro"
              disabled={accion.ocupado}
              onClick={() => accion.correr(() => api.reactivar(bt.block!.id), onCambio)}
            >
              Reactivar mesa
            </button>
          ) : null}
        </div>
      ) : null}

      {opera && bt.state === "LIBRE" ? (
        <form
          className="pn-mesa__bloque"
          onSubmit={(e) => {
            e.preventDefault();
            void accion.correr(() => api.ocupar({ tableId: t.id, customerName: cliente, partySize: jugadores }), onCambio);
          }}
        >
          <h3 className="pn-subtitulo pn-subtitulo--chico">Llegó alguien sin reserva</h3>
          <div className="pn-form__fila">
            <label className="campo">
              <span className="campo__etiqueta">Nombre (opcional)</span>
              <input className="entrada" value={cliente} onChange={(e) => setCliente(e.target.value)} />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Jugadores</span>
              <input
                className="entrada"
                type="number"
                min={1}
                max={12}
                value={jugadores}
                onChange={(e) => setJugadores(Number(e.target.value))}
              />
            </label>
          </div>
          {bt.next ? (
            <p className="pn-nota">Ojo: esta mesa tiene reserva a las {hora12(bt.next.time)}.</p>
          ) : null}
          <button type="submit" className="pn-boton pn-boton--oro" disabled={accion.ocupado}>
            Ocupar mesa
          </button>
        </form>
      ) : null}

      {/* DESPUÉS */}
      <div className="pn-mesa__bloque">
        <h3 className="pn-subtitulo pn-subtitulo--chico">Reservas de este día</h3>
        {delDia.length === 0 ? <p className="pn-nota">Ninguna.</p> : null}
        <ul className="pn-lista-corta">
          {delDia.map((r) => (
            <li key={r.id}>
              <button type="button" className="pn-fila-boton" onClick={() => onAbrirReserva(r.id)}>
                <span className="cifras">
                  {horaCorta(r.time)}–{horaCorta(r.endTime)}
                </span>
                <span>{r.customer.name}</span>
                <span className="pn-estado" data-estado={r.status}>
                  {ESTADO[r.status]}
                </span>
              </button>
              {opera && bt.state === "LIBRE" && activas.includes(r) ? (
                <button
                  type="button"
                  className="pn-boton"
                  disabled={accion.ocupado}
                  onClick={() => accion.correr(() => api.ocupar({ tableId: t.id, reservationId: r.id }), onCambio)}
                >
                  Llegó
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {puede("gestionar:reservas") ? (
          <button type="button" className="pn-boton pn-boton--plano" onClick={() => onNueva({ tableId: t.id, date: vista.date })}>
            Nueva reserva en esta mesa
          </button>
        ) : null}
      </div>

      {opera && !bt.block && bt.state !== "FUERA_DE_SERVICIO" ? (
        bloqueando ? (
          <form
            className="pn-mesa__bloque"
            onSubmit={(e) => {
              e.preventDefault();
              void accion.correr(
                () =>
                  api.bloquear({
                    tableId: t.id,
                    reason: motivo,
                    note: notaBloqueo,
                    // El club está en Bogotá, que no cambia de hora en el año: -05:00 fijo.
                    endsAt: hasta ? `${hasta}:00-05:00` : null,
                  }),
                () => {
                  setBloqueando(false);
                  onCambio();
                },
              );
            }}
          >
            <h3 className="pn-subtitulo pn-subtitulo--chico">Bloquear {t.name}</h3>
            <label className="campo">
              <span className="campo__etiqueta">Motivo</span>
              <select className="entrada" value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoBloqueo)}>
                {MOTIVOS.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.texto}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Nota</span>
              <input className="entrada" value={notaBloqueo} onChange={(e) => setNotaBloqueo(e.target.value)} />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Hasta (vacío = hasta reactivarla)</span>
              <input className="entrada" type="datetime-local" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </label>
            <div className="pn-form__acciones">
              <button type="submit" className="pn-boton pn-boton--oro" disabled={accion.ocupado}>
                Bloquear mesa
              </button>
              <button type="button" className="pn-boton pn-boton--plano" onClick={() => setBloqueando(false)}>
                Descartar
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="pn-boton pn-boton--plano" onClick={() => setBloqueando(true)}>
            Bloquear mesa…
          </button>
        )
      ) : null}

      {accion.error ? (
        <p className="aviso" role="alert">
          {accion.error}
        </p>
      ) : null}
    </div>
  );
}

// ── La agenda del día ────────────────────────────────────────────────────────

function AgendaDia({
  v,
  ahora,
  onAbrir,
  onLibre,
}: {
  v: VistaPanel;
  ahora: number;
  onAbrir: (id: number) => void;
  onLibre: (tableId: number, time: string) => void;
}) {
  const a = v.agenda;
  if (a.closed || a.times.length === 0) return <p className="pn-nota">El club está cerrado este día.</p>;
  const abre = minutos(a.open);
  const cierra = minutos(a.close);
  const span = cierra - abre;
  const ahoraMin = v.isToday ? ahoraEnElClub(new Date(ahora)).minutos : null;
  const visibles = v.reservations.filter((r) => r.status !== "CANCELADA" && r.status !== "NO_PRESENTADO");

  return (
    <div className="pn-agenda-marco">
      <div className="pn-agenda" style={{ "--columnas": a.times.length } as CSSProperties}>
        <div className="pn-agenda__horas">
          <span />
          {a.times.map((t) => (
            <span key={t} className="cifras">
              {horaCorta(t)}
            </span>
          ))}
        </div>
        {a.tables.map((m) => (
          <div key={m.tableId} className="pn-agenda__fila">
            <span className="pn-agenda__mesa">{m.name}</span>
            <div className="pn-agenda__pista">
              {m.slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  className="pn-agenda__celda"
                  data-estado={s.status}
                  disabled={s.status !== "libre"}
                  onClick={() => onLibre(m.tableId, s.time)}
                  aria-label={`${m.name} ${horaCorta(s.time)}: ${s.status}`}
                />
              ))}
              {visibles
                .filter((r) => r.tableId === m.tableId)
                .map((r) => {
                  const ini = Math.max(minutos(r.time), abre);
                  const fin = Math.min(minutos(r.time) + r.durationMin, cierra);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className="pn-agenda__reserva"
                      data-estado={r.status}
                      style={{ left: `${((ini - abre) / span) * 100}%`, width: `${((fin - ini) / span) * 100}%` }}
                      onClick={() => onAbrir(r.id)}
                      title={`${r.code} · ${r.customer.name} · ${ESTADO[r.status]}`}
                    >
                      <span>{r.customer.name}</span>
                    </button>
                  );
                })}
              {ahoraMin !== null && ahoraMin >= abre && ahoraMin <= cierra ? (
                <span className="pn-agenda__ahora" style={{ left: `${((ahoraMin - abre) / span) * 100}%` }} aria-hidden="true" />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── La lista del día ─────────────────────────────────────────────────────────

export function ListaDelDia({ reservas, onAbrir }: { reservas: Reserva[]; onAbrir: (id: number) => void }) {
  if (reservas.length === 0) return <p className="pn-nota">No hay reservas este día.</p>;
  return (
    <table className="pn-tabla">
      <thead>
        <tr>
          <th scope="col">Hora</th>
          <th scope="col">Mesa</th>
          <th scope="col">Cliente</th>
          <th scope="col">Jugadores</th>
          <th scope="col">Estado</th>
          <th scope="col">Código</th>
        </tr>
      </thead>
      <tbody>
        {reservas.map((r) => (
          <tr key={r.id} onClick={() => onAbrir(r.id)} data-estado={r.status}>
            <td className="cifras">
              {horaCorta(r.time)}–{horaCorta(r.endTime)}
            </td>
            <td>{r.table.name}</td>
            <td>
              <button type="button" className="boton-texto enlace" onClick={() => onAbrir(r.id)}>
                {r.customer.name}
              </button>
            </td>
            <td className="cifras">{r.partySize}</td>
            <td>
              <span className="pn-estado" data-estado={r.status}>
                {ESTADO[r.status]}
              </span>
            </td>
            <td className="cifras">{r.code}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
