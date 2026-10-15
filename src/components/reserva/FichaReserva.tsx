import type { ReactNode } from "react";

import { IconoWhatsApp } from "@/components/sitio/Iconos";
import { fechaLarga, hora12, horas, pesos } from "@/lib/formato";
import type { ReservaPublica } from "@/lib/tipos";

/* Una reserva ya hecha, como la ve su dueño: el código grande, lo que reservó y cómo separarla.
   La usan la confirmación al terminar y la página de Mi reserva. */

export function FichaReserva({ reserva, acciones }: { reserva: ReservaPublica; acciones?: ReactNode }) {
  const pago = reserva.payment;
  const hayDatosDePago = !!(pago.key || pago.account);
  const pendiente = reserva.status === "PENDIENTE";

  return (
    <article className="ficha" data-estado={reserva.status}>
      <div className="ficha__cabeza">
        <p className="ficha__estado">{reserva.statusLabel}</p>
        <p className="ficha__codigo cifras" aria-label={`Código de reserva ${reserva.code.split("").join(" ")}`}>
          {reserva.code}
        </p>
        <p className="ficha__ayuda">Guarda este código: con él y tu celular consultas o cancelas la reserva.</p>
      </div>

      <dl className="ficha__datos">
        <div>
          <dt>Mesa</dt>
          <dd>{reserva.table.name}</dd>
        </div>
        <div>
          <dt>Día</dt>
          <dd>{fechaLarga(reserva.date)}</dd>
        </div>
        <div>
          <dt>Hora</dt>
          <dd className="cifras">
            {hora12(reserva.time)} a {hora12(reserva.endTime)} · {horas(reserva.durationMin / 60)}
          </dd>
        </div>
        <div>
          <dt>A nombre de</dt>
          <dd>
            {reserva.customerName} · {reserva.partySize} {reserva.partySize === 1 ? "jugador" : "jugadores"}
          </dd>
        </div>
      </dl>

      {pendiente ? (
        <div className="ficha__anticipo">
          <h2 className="ficha__titulo">Sepárala con el anticipo</h2>
          <p>
            {reserva.deposit ? (
              <>
                Envía <strong className="cifras">{pesos(reserva.deposit.amount)}</strong> ({reserva.deposit.label.toLowerCase()}) y
                mándanos el comprobante por WhatsApp. Al recibirlo confirmamos tu mesa.
              </>
            ) : (
              <>Escríbenos por WhatsApp y te confirmamos el valor del anticipo para esa hora.</>
            )}
          </p>
          {hayDatosDePago ? (
            <dl className="ficha__pago">
              {pago.key ? (
                <div>
                  <dt>Llave</dt>
                  <dd className="cifras">{pago.key}</dd>
                </div>
              ) : null}
              {pago.account ? (
                <div>
                  <dt>{pago.bank || "Cuenta"}</dt>
                  <dd className="cifras">{pago.account}</dd>
                </div>
              ) : null}
              {pago.holder ? (
                <div>
                  <dt>Titular</dt>
                  <dd>{pago.holder}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="ficha__nota">Te enviamos los datos de pago por WhatsApp.</p>
          )}
          {reserva.whatsappUrl ? (
            <a className="boton boton--grande" href={reserva.whatsappUrl} target="_blank" rel="noreferrer">
              <IconoWhatsApp /> Enviar comprobante por WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}

      {acciones ? <div className="ficha__acciones">{acciones}</div> : null}
    </article>
  );
}
