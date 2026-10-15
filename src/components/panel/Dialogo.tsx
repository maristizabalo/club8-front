"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* Un diálogo modal sobre el <dialog> nativo: atrapa el foco, cierra con Escape y devuelve el foco
   a donde estaba. Es lo único del panel que flota, y por eso es lo único con sombra. */

export function Dialogo({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = "angosto",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: "angosto" | "ancho";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className={`pn-dialogo pn-dialogo--${ancho}`}
      onClose={onCerrar}
      onClick={(e) => {
        // Un clic en el fondo (fuera de la caja) cierra.
        if (e.target === ref.current) onCerrar();
      }}
      aria-labelledby="dialogo-titulo"
    >
      {abierto ? (
        <div className="pn-dialogo__caja">
          <div className="pn-dialogo__cabeza">
            <h2 id="dialogo-titulo" className="pn-subtitulo">
              {titulo}
            </h2>
            <button type="button" className="pn-boton pn-boton--plano" onClick={onCerrar} aria-label="Cerrar">
              Cerrar
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
