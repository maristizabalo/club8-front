"use client";

import { useState } from "react";

import { Plano } from "@/components/plano/Plano";
import { api } from "@/lib/api";
import { fechaHoraDeInstante } from "@/lib/formato";
import { useSesion } from "@/lib/sesion";
import type { Mesa, MotivoBloqueo } from "@/lib/tipos";

import { MOTIVOS, textoMotivo } from "./estados";
import { useAccion, useCarga } from "./ganchos";

/* Las mesas del salón. Es la pantalla que le da sentido al plano del sitio: si nadie pone las mesas
   donde están de verdad, el plano público es un adorno. La posición se guarda al soltar la mesa,
   sin un botón de guardar que alguien pueda olvidar. */

export function EditorMesas() {
  const { puede } = useSesion();
  const edita = puede("gestionar:club");
  const opera = puede("operar:mesas");
  const { datos, error, recargar } = useCarga(() => api.mesas(), "mesas");
  const bloqueos = useCarga(() => api.bloqueos(), "bloqueos");
  const accion = useAccion();
  const [elegida, setElegida] = useState<number | null>(null);

  const mesas = datos?.tables ?? [];
  const mesa = mesas.find((m) => m.id === elegida) ?? null;

  const mover = (id: number, x: number, y: number) =>
    void accion.correr(() => api.actualizarMesa(id, { mapX: x, mapY: y }), recargar);

  return (
    <div className="pn-pagina">
      <header className="pn-cabeza">
        <div>
          <h1 className="pn-titulo">Mesas</h1>
          <p className="pn-nota">
            {edita ? "Arrastra cada mesa a su lugar en el salón. Con el teclado: flechas, y Mayús para saltos largos." : "Plano del salón."}
          </p>
        </div>
      </header>

      {error || accion.error ? (
        <p className="aviso" role="alert">
          {error || accion.error}
        </p>
      ) : null}

      <div className="pn-salon">
        <section className="pn-tarjeta pn-salon__plano" aria-label="Plano editable">
          <Plano
            fichas={mesas.map((m) => ({
              id: m.id,
              numero: m.number,
              nombre: m.name,
              x: m.mapX,
              y: m.mapY,
              vertical: m.rotation === 90,
              tono: m.enabled ? "vivo" : "fuera",
              etiqueta: m.enabled ? m.name : "Fuera de servicio",
            }))}
            elementos={datos?.floorPlan ?? []}
            seleccionada={elegida}
            onElegir={setElegida}
            editable={edita}
            onMover={mover}
            etiqueta="Plano del salón para colocar las mesas"
          />
        </section>

        <aside className="pn-tarjeta pn-salon__mesa">
          {mesa ? (
            <FormMesa key={mesa.id} mesa={mesa} edita={edita} onGuardada={recargar} />
          ) : (
            <div className="pn-vacio">
              <h2 className="pn-subtitulo">Elige una mesa</h2>
              <p>Para cambiar su nombre, su orientación, sus notas internas o ponerla fuera de servicio.</p>
            </div>
          )}
        </aside>
      </div>

      <section className="pn-tarjeta" aria-labelledby="t-bloqueos">
        <h2 id="t-bloqueos" className="pn-subtitulo">
          Bloqueos vigentes y programados
        </h2>
        {!bloqueos.datos || bloqueos.datos.length === 0 ? (
          <p className="pn-nota">No hay mesas bloqueadas.</p>
        ) : (
          <table className="pn-tabla">
            <thead>
              <tr>
                <th scope="col">Qué</th>
                <th scope="col">Motivo</th>
                <th scope="col">Desde</th>
                <th scope="col">Hasta</th>
                <th scope="col">
                  <span className="solo-lector">Acción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {bloqueos.datos.map((b) => (
                <tr key={b.id}>
                  <td>{b.tableId ? (mesas.find((m) => m.id === b.tableId)?.name ?? `Mesa ${b.tableId}`) : "Todo el salón"}</td>
                  <td>
                    {textoMotivo(b.reason)}
                    {b.note ? ` · ${b.note}` : ""}
                  </td>
                  <td className="cifras">{fechaHoraDeInstante(b.startsAt)}</td>
                  <td className="cifras">{b.endsAt ? fechaHoraDeInstante(b.endsAt) : "Hasta reactivar"}</td>
                  <td>
                    {opera ? (
                      <button
                        type="button"
                        className="pn-boton"
                        disabled={accion.ocupado}
                        onClick={() =>
                          accion.correr(
                            () => api.reactivar(b.id),
                            () => {
                              bloqueos.recargar();
                              recargar();
                            },
                          )
                        }
                      >
                        Reactivar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {opera ? <BloquearSalon onHecho={bloqueos.recargar} /> : null}
      </section>
    </div>
  );
}

function FormMesa({ mesa, edita, onGuardada }: { mesa: Mesa; edita: boolean; onGuardada: () => void }) {
  const accion = useAccion();
  const [f, setF] = useState({
    name: mesa.name,
    detail: mesa.detail,
    notes: mesa.notes,
    enabled: mesa.enabled,
    rotation: mesa.rotation,
  });
  const historial = useCarga(() => api.historialMesa(mesa.id), `historial-${mesa.id}`);

  return (
    <form
      className="pn-form"
      onSubmit={(e) => {
        e.preventDefault();
        void accion.correr(() => api.actualizarMesa(mesa.id, f), onGuardada);
      }}
    >
      <h2 className="pn-subtitulo">{mesa.name}</h2>
      <label className="campo">
        <span className="campo__etiqueta">Nombre</span>
        <input className="entrada" value={f.name} disabled={!edita} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Lo que ve el cliente</span>
        <input className="entrada" value={f.detail} disabled={!edita} onChange={(e) => setF({ ...f, detail: e.target.value })} />
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Notas internas</span>
        <textarea className="entrada" value={f.notes} disabled={!edita} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </label>
      <fieldset className="campo campo--grupo">
        <legend className="campo__etiqueta">Orientación en el plano</legend>
        <div className="segmentos">
          {[
            { v: 0 as const, t: "Horizontal" },
            { v: 90 as const, t: "Vertical" },
          ].map((o) => (
            <label key={o.v} className="segmento">
              <input
                type="radio"
                name="orientacion"
                checked={f.rotation === o.v}
                disabled={!edita}
                onChange={() => setF({ ...f, rotation: o.v })}
              />
              <span>{o.t}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="pn-interruptor">
        <input type="checkbox" checked={f.enabled} disabled={!edita} onChange={(e) => setF({ ...f, enabled: e.target.checked })} />
        <span>{f.enabled ? "En servicio" : "Fuera de servicio (no se puede reservar)"}</span>
      </label>
      {accion.error ? (
        <p className="aviso" role="alert">
          {accion.error}
        </p>
      ) : null}
      {edita ? (
        <button type="submit" className="pn-boton pn-boton--oro" disabled={accion.ocupado}>
          Guardar mesa
        </button>
      ) : null}

      <h3 className="pn-subtitulo pn-subtitulo--chico">Historial</h3>
      <ol className="pn-historial">
        {(historial.datos ?? [])
          .slice(-8)
          .reverse()
          .map((h) => (
            <li key={h.id}>
              <span className="cifras">{fechaHoraDeInstante(h.at)}</span>
              <span>{h.summary}</span>
              <span className="pn-nota">{h.actorName}</span>
            </li>
          ))}
      </ol>
    </form>
  );
}

function BloquearSalon({ onHecho }: { onHecho: () => void }) {
  const accion = useAccion();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<MotivoBloqueo>("torneo");
  const [nota, setNota] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  if (!abierto) {
    return (
      <button type="button" className="pn-boton pn-boton--plano" onClick={() => setAbierto(true)}>
        Bloquear todo el salón (torneo, evento privado)…
      </button>
    );
  }

  return (
    <form
      className="pn-form pn-form--marco"
      onSubmit={(e) => {
        e.preventDefault();
        void accion.correr(
          () =>
            api.bloquear({
              tableId: null,
              reason: motivo,
              note: nota,
              // Bogotá no cambia de hora en el año: -05:00 fijo.
              startsAt: desde ? `${desde}:00-05:00` : null,
              endsAt: hasta ? `${hasta}:00-05:00` : null,
            }),
          () => {
            setAbierto(false);
            onHecho();
          },
        );
      }}
    >
      <h3 className="pn-subtitulo pn-subtitulo--chico">Bloquear todo el salón</h3>
      <div className="pn-form__fila">
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
          <span className="campo__etiqueta">Desde (vacío = ahora)</span>
          <input className="entrada" type="datetime-local" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Hasta</span>
          <input className="entrada" type="datetime-local" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>
      <label className="campo">
        <span className="campo__etiqueta">Nota</span>
        <input className="entrada" value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>
      {accion.error ? (
        <p className="aviso" role="alert">
          {accion.error}
        </p>
      ) : null}
      <div className="pn-form__acciones">
        <button type="submit" className="pn-boton pn-boton--oro" disabled={accion.ocupado}>
          Bloquear el salón
        </button>
        <button type="button" className="pn-boton pn-boton--plano" onClick={() => setAbierto(false)}>
          Descartar
        </button>
      </div>
    </form>
  );
}
