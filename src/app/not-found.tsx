import Link from "next/link";

export default function NoEncontrada() {
  return (
    <main className="interior interior--angosto" style={{ minHeight: "70vh" }}>
      <h1 className="interior__titulo">Esa página no está en el club</h1>
      <p className="interior__bajada">Puede que el enlace esté viejo. Desde el inicio llegas a todo.</p>
      <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link className="boton" href="/reservar">
          Reservar mesa
        </Link>
        <Link className="boton boton--sobrio" href="/">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
