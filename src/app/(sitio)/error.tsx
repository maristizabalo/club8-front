"use client";

import Link from "next/link";

/* Un fallo de JavaScript en una página del sitio no deja la pantalla en blanco: se dice qué pasó y
   se ofrece reintentar o escribir por WhatsApp. */
export default function ErrorSitio({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="interior interior--angosto">
      <h1 className="interior__titulo">Algo no cargó bien</h1>
      <p className="interior__bajada">Puede ser la conexión. Intenta de nuevo; si sigue igual, escríbenos y te ayudamos con la reserva.</p>
      <div className="ficha__acciones" style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" className="boton" onClick={retry}>
          Intentar de nuevo
        </button>
        <Link className="boton boton--sobrio" href="/">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
