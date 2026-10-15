"use client";

/* Un fallo en una pantalla del panel no se lleva el turno entero: se reintenta sin perder la sesión. */
export default function ErrorPanel({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="pn-tarjeta" role="alert">
      <h1 className="pn-titulo">Esta pantalla falló</h1>
      <p className="pn-nota">{error.message || "Error inesperado."}</p>
      <div>
        <button type="button" className="pn-boton pn-boton--oro" onClick={retry}>
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
