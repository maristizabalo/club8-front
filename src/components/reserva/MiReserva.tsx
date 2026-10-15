"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { apiPublica, mensajeDe } from "@/lib/api";
import { fechaHoraDeInstante } from "@/lib/formato";
import type { ReservaPublica } from "@/lib/tipos";

import { FichaReserva } from "./FichaReserva";

/* Consultar y cancelar una reserva con el código y el celular. El celular viaja en el cuerpo de
   la petición, nunca en la URL. */

export function MiReserva({ whatsapp }: { whatsapp: string }) {
  const [codigo, setCodigo] = useState("");
  const [celular, setCelular] = useState("");
  const [reserva, setReserva] = useState<ReservaPublica | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const consultar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      setReserva(await apiPublica.consultar(codigo.trim(), celular));
    } catch (err) {
      setReserva(null);
      setError(mensajeDe(err));
    } finally {
      setCargando(false);
    }
  };

  const cancelar = async () => {
    if (!reserva) return;
    setError("");
    setCargando(true);
    try {
      setReserva(await apiPublica.cancelar(reserva.code, celular));
      setConfirmando(false);
    } catch (err) {
      setError(mensajeDe(err));
    } finally {
      setCargando(false);
    }
  };

  const waCambio =
    whatsapp && reserva
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola Club 8, quiero cambiar mi reserva ${reserva.code}.`)}`
      : "";

  if (reserva) {
    return (
      <div className="mireserva">
        <FichaReserva
          reserva={reserva}
          acciones={
            <>
              {reserva.canCancel ? (
                confirmando ? (
                  <div className="confirmar">
                    <p>¿Seguro que quieres cancelarla? La mesa queda libre para otra persona.</p>
                    <div className="confirmar__botones">
                      <button type="button" className="boton" onClick={cancelar} disabled={cargando}>
                        {cargando ? "Cancelando…" : "Sí, cancelar la reserva"}
                      </button>
                      <button type="button" className="boton boton--sobrio" onClick={() => setConfirmando(false)}>
                        No, mantenerla
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="boton boton--sobrio" onClick={() => setConfirmando(true)}>
                    Cancelar reserva
                  </button>
                )
              ) : reserva.status === "PENDIENTE" || reserva.status === "CONFIRMADA" ? (
                <p className="campo__ayuda">
                  Ya no se puede cancelar desde la web
                  {reserva.cancelUntil ? ` (era hasta el ${fechaHoraDeInstante(reserva.cancelUntil)})` : ""}. Escríbenos por
                  WhatsApp.
                </p>
              ) : null}
              {waCambio && (reserva.status === "PENDIENTE" || reserva.status === "CONFIRMADA") ? (
                <a className="boton boton--sobrio" href={waCambio} target="_blank" rel="noreferrer">
                  Cambiar la hora por WhatsApp
                </a>
              ) : null}
              <button
                type="button"
                className="enlace boton-texto"
                onClick={() => {
                  setReserva(null);
                  setConfirmando(false);
                }}
              >
                Consultar otra reserva
              </button>
            </>
          }
        />
        {error ? (
          <p className="aviso" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="consulta" onSubmit={consultar} noValidate>
      <div className="campo">
        <label className="campo__etiqueta" htmlFor="m-codigo">
          Código de la reserva
        </label>
        <input
          id="m-codigo"
          className="entrada cifras consulta__codigo"
          placeholder="C8-XXXX"
          autoCapitalize="characters"
          autoComplete="off"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          required
        />
      </div>
      <div className="campo">
        <label className="campo__etiqueta" htmlFor="m-celular">
          Celular con el que reservaste
        </label>
        <input
          id="m-celular"
          className="entrada cifras"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="301 641 4894"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
          required
        />
      </div>
      {error ? (
        <p className="aviso" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="boton boton--grande" disabled={cargando || !codigo.trim() || !celular.trim()}>
        {cargando ? "Buscando…" : "Ver mi reserva"}
      </button>
      <p className="campo__ayuda">
        ¿Aún no tienes una?{" "}
        <Link className="enlace" href="/reservar">
          Reserva tu mesa
        </Link>
        .
      </p>
    </form>
  );
}
