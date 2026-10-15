"use client";

import { useState } from "react";

import { api } from "@/lib/api";
import { ahoraEnElClub, celular, fechaHoraDeInstante, fechaLarga, hora12, horas, pesos } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import type { EstadoReserva, Mesa } from "@/lib/tipos";

import { Dialogo } from "./Dialogo";
import { ACCION_ESTADO, ESTADO, ORIGEN } from "./estados";
import { useAccion, useCarga } from "./ganchos";

/* El detalle de una reserva: todo lo que el personal necesita cuando el cliente llama o llega.
   Las acciones que se ofrecen son sólo las que el estado actual permite. */

export function CajonReserva({
  id,
  mesas,
  onCerrar,
  onCambio,
}: {
  id: number | null;
  mesas: Mesa[];
  onCerrar: () => void;
  onCambio: () => void;
}) {
  return (
    <Dialogo abierto={id !== null} onCerrar={onCerrar} titulo="Reserva" ancho="ancho">
      {id !== null ? <Detalle id={id} mesas={mesas} onCambio={onCambio} onCerrar={onCerrar} /> : null}
    </Dialogo>
  );
}

function Detalle({ id, mesas, onCambio, onCerrar }: { id: number; mesas: Mesa[]; onCambio: () => void; onCerrar: () => void }) {
  const { puede } = useSesion();
  const { datos, error, recargar } = useCarga(() => api.reserva(id), `reserva-${id}`);
  const accion = useAccion();
  const [editando, setEditando] = useState(false);
  const [nota, setNota] = useState("");

  if (!datos) return <p className="pn-nota">{error || "Cargando la reserva…"}</p>;
  const r = datos.reservation;
  const activa = r.status === "PENDIENTE" || r.status === "CONFIRMADA";
  const hoy = ahoraEnElClub().fecha === r.date;
  const gestiona = puede("gestionar:reservas");
  const opera = puede("operar:mesas");

  const listo = () => {
    recargar();
    onCambio();
  };

  const cambiar = (estado: EstadoReserva) => accion.correr(() => api.cambiarEstado(r.id, estado, nota), listo);
  const llego = () => accion.correr(() => api.ocupar({ tableId: r.tableId, reservationId: r.id }), () => {
    onCambio();
    onCerrar();
  });

  return (
    <div className="pn-detalle">
      <div className="pn-detalle__cabeza">
        <p className="pn-codigo cifras">{r.code}</p>
        <span className="pn-estado" data-estado={r.status}>
          {ESTADO[r.status]}
        </span>
      </div>

      {editando ? (
        <EditarReserva
          r={r}
          mesas={mesas}
          onCancelar={() => setEditando(false)}
          onGuardado={() => {
            setEditando(false);
            listo();
          }}
        />
      ) : (
        <dl className="pn-datos">
          <div>
            <dt>Cliente</dt>
            <dd>{r.customer.name}</dd>
          </div>
          <div>
            <dt>Celular</dt>
            <dd className="cifras">
              {datos.whatsappUrl ? (
                <a className="enlace" href={datos.whatsappUrl} target="_blank" rel="noreferrer">
                  {celular(r.customer.phone)}
                </a>
              ) : (
                celular(r.customer.phone)
              )}
            </dd>
          </div>
          <div>
            <dt>Mesa</dt>
            <dd>{r.table.name}</dd>
          </div>
          <div>
            <dt>Día</dt>
            <dd>{fechaLarga(r.date)}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd className="cifras">
              {hora12(r.time)} a {hora12(r.endTime)} · {horas(r.durationMin / 60)}
            </dd>
          </div>
          <div>
            <dt>Jugadores</dt>
            <dd>{r.partySize}</dd>
          </div>
          <div>
            <dt>Anticipo</dt>
            <dd className="cifras">{datos.deposit ? `${pesos(datos.deposit.amount)} (${datos.deposit.band})` : "Por confirmar"}</dd>
          </div>
          <div>
            <dt>Origen</dt>
            <dd>{ORIGEN[r.source]}</dd>
          </div>
          {r.customer.email ? (
            <div>
              <dt>Correo</dt>
              <dd>{r.customer.email}</dd>
            </div>
          ) : null}
          <div>
            <dt>Visitas del cliente</dt>
            <dd>{r.customer.visitsCount}</dd>
          </div>
          {r.notes ? (
            <div className="pn-datos__ancho">
              <dt>Observaciones</dt>
              <dd>{r.notes}</dd>
            </div>
          ) : null}
        </dl>
      )}

      {activa && gestiona && !editando ? (
        <div className="pn-detalle__acciones">
          {hoy && opera ? (
            <button type="button" className="pn-boton pn-boton--oro" onClick={llego} disabled={accion.ocupado}>
              Llegó: ocupar {r.table.name}
            </button>
          ) : null}
          {r.transitions
            .filter((t) => t !== "ATENDIDA" || !hoy)
            .map((t) => (
              <button
                key={t}
                type="button"
                className={t === "CONFIRMADA" ? "pn-boton pn-boton--oro" : "pn-boton"}
                onClick={() => cambiar(t)}
                disabled={accion.ocupado}
              >
                {ACCION_ESTADO[t] ?? ESTADO[t]}
              </button>
            ))}
          <button type="button" className="pn-boton pn-boton--plano" onClick={() => setEditando(true)}>
            Cambiar mesa u hora
          </button>
          <div className="campo pn-detalle__nota">
            <label className="campo__etiqueta" htmlFor="nota-estado">
              Nota para el historial <span className="campo__ayuda">(opcional)</span>
            </label>
            <input id="nota-estado" className="entrada" value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
        </div>
      ) : null}
      {accion.error ? (
        <p className="aviso" role="alert">
          {accion.error}
        </p>
      ) : null}

      <section>
        <h3 className="pn-subtitulo pn-subtitulo--chico">Historial</h3>
        <ol className="pn-historial">
          {datos.history.map((h) => (
            <li key={h.id}>
              <span className="cifras">{fechaHoraDeInstante(h.at)}</span>
              <span>{h.summary}</span>
              <span className="pn-nota">{h.actorName}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function EditarReserva({
  r,
  mesas,
  onCancelar,
  onGuardado,
}: {
  r: { id: number; tableId: number; date: string; time: string; durationMin: number; partySize: number; notes: string };
  mesas: Mesa[];
  onCancelar: () => void;
  onGuardado: () => void;
}) {
  const accion = useAccion();
  const [f, setF] = useState({
    tableId: r.tableId,
    date: r.date,
    time: r.time,
    hours: r.durationMin / 60,
    partySize: r.partySize,
    notes: r.notes,
  });

  return (
    <form
      className="pn-form"
      onSubmit={(e) => {
        e.preventDefault();
        void accion.correr(() => api.actualizarReserva(r.id, f), onGuardado);
      }}
    >
      <div className="pn-form__fila">
        <label className="campo">
          <span className="campo__etiqueta">Mesa</span>
          <select className="entrada" value={f.tableId} onChange={(e) => setF({ ...f, tableId: Number(e.target.value) })}>
            {mesas.map((m) => (
              <option key={m.id} value={m.id} disabled={!m.enabled}>
                {m.name}
                {m.enabled ? "" : " (fuera de servicio)"}
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Día</span>
          <input className="entrada" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Hora</span>
          <input className="entrada" type="time" step={900} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Horas</span>
          <input
            className="entrada"
            type="number"
            min={1}
            max={12}
            value={f.hours}
            onChange={(e) => setF({ ...f, hours: Number(e.target.value) })}
          />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Jugadores</span>
          <input
            className="entrada"
            type="number"
            min={1}
            max={12}
            value={f.partySize}
            onChange={(e) => setF({ ...f, partySize: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="campo">
        <span className="campo__etiqueta">Observaciones</span>
        <textarea className="entrada" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </label>
      {accion.error ? (
        <p className="aviso" role="alert">
          {accion.error}
        </p>
      ) : null}
      <div className="pn-form__acciones">
        <button type="submit" className="pn-boton pn-boton--oro" disabled={accion.ocupado}>
          Guardar cambios
        </button>
        <button type="button" className="pn-boton pn-boton--plano" onClick={onCancelar}>
          Descartar
        </button>
      </div>
    </form>
  );
}
