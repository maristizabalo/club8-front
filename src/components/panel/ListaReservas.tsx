"use client";

import { useMemo, useState } from "react";

import { api } from "@/lib/api";
import { ahoraEnElClub, celular, fechaCorta, horaCorta, sumarDias } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import type { EstadoReserva } from "@/lib/tipos";

import { CajonReserva } from "./CajonReserva";
import { ESTADO, ORIGEN } from "./estados";
import { useCarga } from "./ganchos";
import { NuevaReserva } from "./NuevaReserva";

/* Todas las reservas con filtros: por fechas, por estado y por búsqueda (código, nombre o
   celular). Es la pantalla para cuando un cliente llama y dice "tengo una reserva". */

const ESTADOS: EstadoReserva[] = ["PENDIENTE", "CONFIRMADA", "ATENDIDA", "CANCELADA", "NO_PRESENTADO"];

export function ListaReservas() {
  const hoy = useMemo(() => ahoraEnElClub().fecha, []);
  const { puede } = useSesion();
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(sumarDias(hoy, 14));
  const [estados, setEstados] = useState<EstadoReserva[]>(["PENDIENTE", "CONFIRMADA"]);
  const [busqueda, setBusqueda] = useState("");
  const [abierta, setAbierta] = useState<number | null>(null);
  const [nueva, setNueva] = useState(false);

  const filtro = { from: desde, to: hasta, status: estados.join(","), q: busqueda.trim() };
  const { datos: reservas, error, cargando, recargar } = useCarga(() => api.reservas(filtro), JSON.stringify(filtro));
  const { datos: mesas } = useCarga(() => api.mesas().then((r) => r.tables), "mesas");

  const alternar = (e: EstadoReserva) =>
    setEstados((lista) => (lista.includes(e) ? lista.filter((x) => x !== e) : [...lista, e]));

  return (
    <div className="pn-pagina">
      <header className="pn-cabeza">
        <div>
          <h1 className="pn-titulo">Reservas</h1>
          <p className="pn-nota">{reservas ? `${reservas.length} en el filtro` : " "}</p>
        </div>
        {puede("gestionar:reservas") ? (
          <button type="button" className="pn-boton pn-boton--oro" onClick={() => setNueva(true)}>
            Nueva reserva
          </button>
        ) : null}
      </header>

      <div className="pn-tarjeta pn-filtros">
        <label className="campo">
          <span className="campo__etiqueta">Buscar</span>
          <input
            className="entrada"
            type="search"
            placeholder="Código, nombre o celular"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Desde</span>
          <input className="entrada" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Hasta</span>
          <input className="entrada" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
        <fieldset className="campo pn-filtros__estados">
          <legend className="campo__etiqueta">Estado</legend>
          <div className="pn-chips">
            {ESTADOS.map((e) => (
              <button key={e} type="button" className="chip" aria-pressed={estados.includes(e)} onClick={() => alternar(e)}>
                {ESTADO[e]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {error ? (
        <p className="aviso" role="alert">
          {error}
        </p>
      ) : null}

      <div className="pn-tarjeta pn-tabla-marco" aria-busy={cargando}>
        {!reservas ? (
          <p className="pn-nota">Cargando…</p>
        ) : reservas.length === 0 ? (
          <p className="pn-nota">No hay reservas con esos filtros.</p>
        ) : (
          <table className="pn-tabla">
            <thead>
              <tr>
                <th scope="col">Día</th>
                <th scope="col">Hora</th>
                <th scope="col">Mesa</th>
                <th scope="col">Cliente</th>
                <th scope="col">Celular</th>
                <th scope="col">Estado</th>
                <th scope="col">Origen</th>
                <th scope="col">Código</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id} onClick={() => setAbierta(r.id)} data-estado={r.status}>
                  <td>{fechaCorta(r.date)}</td>
                  <td className="cifras">
                    {horaCorta(r.time)}–{horaCorta(r.endTime)}
                  </td>
                  <td>{r.table.name}</td>
                  <td>
                    <button type="button" className="boton-texto enlace" onClick={() => setAbierta(r.id)}>
                      {r.customer.name}
                    </button>
                  </td>
                  <td className="cifras">{celular(r.customer.phone)}</td>
                  <td>
                    <span className="pn-estado" data-estado={r.status}>
                      {ESTADO[r.status]}
                    </span>
                  </td>
                  <td>{ORIGEN[r.source]}</td>
                  <td className="cifras">{r.code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CajonReserva id={abierta} mesas={mesas ?? []} onCerrar={() => setAbierta(null)} onCambio={recargar} />
      <NuevaReserva
        abierto={nueva}
        mesas={mesas ?? []}
        fecha={hoy}
        onCerrar={() => setNueva(false)}
        onCreada={() => {
          setNueva(false);
          recargar();
        }}
      />
    </div>
  );
}
