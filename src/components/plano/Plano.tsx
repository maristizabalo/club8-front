"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import type { ElementoPlano } from "@/lib/tipos";

import { MesaBillar, type TonoMesa } from "./MesaBillar";

/* ─────────────────────────────────────────────────────────────────────────────
   El plano del salón.

   Es la misma pieza para el cliente que reserva, para el panel que opera y para el editor que
   coloca las mesas donde están de verdad. Cada mesa es un botón: se elige con el dedo, con el
   ratón o con el teclado, y su etiqueta dice lo que el color muestra.

   La posición de cada mesa es su centro en porcentaje del salón, así el plano se dibuja igual
   en un teléfono que en la pantalla de la barra.
   ───────────────────────────────────────────────────────────────────────────── */

export type FichaPlano = {
  id: number;
  numero: number;
  nombre: string;
  x: number;
  y: number;
  vertical: boolean;
  tono: TonoMesa;
  /** Texto corto bajo la mesa: "9 h libres", "En juego 1 h 05". */
  etiqueta?: string;
  /** Lo que lee un lector de pantalla además del nombre. */
  descripcion?: string;
  /** La tira de horas del día: cada hora libre o tomada. */
  horas?: Array<"libre" | "tomada" | "pasada">;
  bolas?: boolean;
  resaltada?: boolean;
  atenuada?: boolean;
  alerta?: boolean;
};

const limitar = (v: number) => Math.max(2, Math.min(98, v));
const redondear = (v: number) => Math.round(v * 10) / 10;

export function Plano({
  fichas,
  elementos = [],
  seleccionada,
  onElegir,
  editable = false,
  onMover,
  etiqueta,
  pie,
}: {
  fichas: FichaPlano[];
  elementos?: ElementoPlano[];
  seleccionada?: number | null;
  onElegir?: (id: number) => void;
  editable?: boolean;
  /** Se llama al soltar una mesa, con la posición final en porcentaje. */
  onMover?: (id: number, x: number, y: number) => void;
  /** Nombre accesible del plano completo. */
  etiqueta: string;
  pie?: ReactNode;
}) {
  const zona = useRef<HTMLDivElement>(null);
  const arrastrando = useRef<number | null>(null);
  const [borrador, setBorrador] = useState<Record<number, { x: number; y: number }>>({});

  // Cuando llegan datos frescos, el borrador local deja de mandar. Si el guardado falló, esto es
  // justamente lo que devuelve la mesa a su sitio.
  useEffect(() => {
    if (arrastrando.current === null) setBorrador((b) => (Object.keys(b).length ? {} : b));
  }, [fichas]);

  const posicion = (f: FichaPlano) => borrador[f.id] ?? { x: f.x, y: f.y };

  const alBajar = (e: PointerEvent<HTMLButtonElement>, f: FichaPlano) => {
    if (!editable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastrando.current = f.id;
  };

  const alMover = (e: PointerEvent<HTMLButtonElement>, f: FichaPlano) => {
    if (arrastrando.current !== f.id) return;
    const caja = zona.current?.getBoundingClientRect();
    if (!caja || caja.width === 0) return;
    const x = limitar(((e.clientX - caja.left) / caja.width) * 100);
    const y = limitar(((e.clientY - caja.top) / caja.height) * 100);
    setBorrador((b) => ({ ...b, [f.id]: { x, y } }));
  };

  const alSoltar = (e: PointerEvent<HTMLButtonElement>, f: FichaPlano) => {
    if (arrastrando.current !== f.id) return;
    arrastrando.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    const p = borrador[f.id];
    if (p) onMover?.(f.id, redondear(p.x), redondear(p.y));
  };

  const alTeclado = (e: KeyboardEvent<HTMLButtonElement>, f: FichaPlano) => {
    if (!editable) return;
    const salto = e.shiftKey ? 5 : 1;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-salto, 0],
      ArrowRight: [salto, 0],
      ArrowUp: [0, -salto],
      ArrowDown: [0, salto],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    const p = posicion(f);
    const nuevo = { x: limitar(p.x + d[0]), y: limitar(p.y + d[1]) };
    setBorrador((b) => ({ ...b, [f.id]: nuevo }));
  };

  const alSoltarTecla = (e: KeyboardEvent<HTMLButtonElement>, f: FichaPlano) => {
    if (!editable || !e.key.startsWith("Arrow")) return;
    const p = borrador[f.id];
    if (p) onMover?.(f.id, redondear(p.x), redondear(p.y));
  };

  return (
    <figure className="plano" data-editable={editable || undefined}>
      <div ref={zona} className="plano__salon" role="group" aria-label={etiqueta}>
        {elementos.map((el, i) => (
          <div
            key={`${el.kind}-${i}`}
            className={`plano__elemento plano__elemento--${el.kind}`}
            style={{ left: `${el.x}%`, top: `${el.y}%`, width: `${el.w}%`, height: `${el.h}%` }}
            aria-hidden="true"
          >
            <span>{el.label}</span>
          </div>
        ))}

        {fichas.map((f) => {
          const p = posicion(f);
          const elegida = seleccionada === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className="plano__mesa"
              data-vertical={f.vertical || undefined}
              data-elegida={elegida || undefined}
              data-resaltada={f.resaltada || undefined}
              data-atenuada={f.atenuada || undefined}
              data-alerta={f.alerta || undefined}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              aria-pressed={onElegir ? elegida : undefined}
              aria-label={`${f.nombre}${f.descripcion ? `, ${f.descripcion}` : ""}${editable ? ". Arrastra o usa las flechas para moverla" : ""}`}
              onClick={() => onElegir?.(f.id)}
              onPointerDown={(e) => alBajar(e, f)}
              onPointerMove={(e) => alMover(e, f)}
              onPointerUp={(e) => alSoltar(e, f)}
              onPointerCancel={(e) => alSoltar(e, f)}
              onKeyDown={(e) => alTeclado(e, f)}
              onKeyUp={(e) => alSoltarTecla(e, f)}
            >
              <MesaBillar
                numero={f.numero}
                vertical={f.vertical}
                tono={f.tono}
                bolas={f.bolas}
                baranda={elegida ? "var(--oro)" : undefined}
              />
              {f.horas && f.horas.length > 0 ? (
                <span className="plano__horas" aria-hidden="true">
                  {f.horas.map((h, i) => (
                    <i key={i} data-h={h} />
                  ))}
                </span>
              ) : null}
              {f.etiqueta ? (
                <span className="plano__etiqueta" aria-hidden="true">
                  {f.etiqueta}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {pie ? <figcaption className="plano__pie">{pie}</figcaption> : null}
    </figure>
  );
}
