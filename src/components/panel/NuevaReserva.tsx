"use client";

import { useState } from "react";

import { ErrorAPI, api } from "@/lib/api";
import type { EstadoReserva, Mesa, OrigenReserva } from "@/lib/tipos";

import { Dialogo } from "./Dialogo";
import { useAccion } from "./ganchos";

/* La reserva que entra por teléfono, por WhatsApp o en la barra. Puede nacer confirmada si el
   cliente ya pagó el anticipo. */

export type Prellenado = { tableId?: number; date?: string; time?: string };

export function NuevaReserva({
  abierto,
  mesas,
  fecha,
  prellenado,
  onCerrar,
  onCreada,
}: {
  abierto: boolean;
  mesas: Mesa[];
  fecha: string;
  prellenado?: Prellenado;
  onCerrar: () => void;
  onCreada: () => void;
}) {
  return (
    <Dialogo abierto={abierto} onCerrar={onCerrar} titulo="Nueva reserva" ancho="ancho">
      {abierto ? (
        <Formulario
          // Cada apertura empieza limpia con lo que se tocó en el plano o la agenda.
          key={`${prellenado?.tableId}-${prellenado?.date}-${prellenado?.time}`}
          mesas={mesas}
          fecha={prellenado?.date ?? fecha}
          prellenado={prellenado}
          onCreada={onCreada}
        />
      ) : null}
    </Dialogo>
  );
}

function Formulario({
  mesas,
  fecha,
  prellenado,
  onCreada,
}: {
  mesas: Mesa[];
  fecha: string;
  prellenado?: Prellenado;
  onCreada: () => void;
}) {
  const accion = useAccion();
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    tableId: prellenado?.tableId ?? mesas.find((m) => m.enabled)?.id ?? 0,
    date: fecha,
    time: prellenado?.time ?? "19:00",
    hours: 2,
    partySize: 2,
    name: "",
    phone: "",
    email: "",
    notes: "",
    status: "CONFIRMADA" as EstadoReserva,
    source: "telefono" as OrigenReserva,
  });

  const enviar = async () => {
    setCampos({});
    await accion.correr(
      () =>
        api.crearReserva(f).catch((e) => {
          if (e instanceof ErrorAPI && e.campos) setCampos(e.campos);
          throw e;
        }),
      onCreada,
    );
  };

  const error = (k: string) => (campos[k] ? <p className="campo__error">{campos[k]}</p> : null);

  return (
    <form
      className="pn-form"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
      noValidate
    >
      <div className="pn-form__fila">
        <label className="campo">
          <span className="campo__etiqueta">Mesa</span>
          <select className="entrada" value={f.tableId} onChange={(e) => setF({ ...f, tableId: Number(e.target.value) })}>
            {mesas.map((m) => (
              <option key={m.id} value={m.id} disabled={!m.enabled}>
                {m.name}
              </option>
            ))}
          </select>
          {error("tableId")}
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Día</span>
          <input className="entrada" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          {error("date")}
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Hora</span>
          <input className="entrada" type="time" step={900} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
          {error("time")}
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
          {error("hours")}
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
          {error("partySize")}
        </label>
      </div>
      <div className="pn-form__fila">
        <label className="campo">
          <span className="campo__etiqueta">Nombre del cliente</span>
          <input className="entrada" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          {error("name")}
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Celular</span>
          <input
            className="entrada cifras"
            type="tel"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
          {error("phone")}
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Estado</span>
          <select className="entrada" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as EstadoReserva })}>
            <option value="CONFIRMADA">Confirmada (ya pagó)</option>
            <option value="PENDIENTE">Pendiente de anticipo</option>
          </select>
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Llegó por</span>
          <select className="entrada" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as OrigenReserva })}>
            <option value="telefono">Teléfono o WhatsApp</option>
            <option value="admin">En el club</option>
          </select>
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
          {accion.ocupado ? "Guardando…" : "Crear reserva"}
        </button>
      </div>
    </form>
  );
}
