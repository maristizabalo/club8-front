"use client";

/* El último recurso: si falla el armazón raíz, esta página reemplaza todo y trae su propio HTML y
   sus propios estilos, porque los globales no cargan aquí. */
export default function ErrorGlobal({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es-CO">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0b0c", color: "#f3eee4", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 520, padding: 24 }}>
          <h1 style={{ fontSize: 40, lineHeight: 1, margin: "0 0 16px" }}>Billares Club 8</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5 }}>El sitio tuvo un problema al cargar. Intenta de nuevo en unos segundos.</p>
          <button
            type="button"
            onClick={retry}
            style={{ marginTop: 24, minHeight: 52, padding: "0 24px", border: 0, background: "#d4af37", color: "#0b0b0c", fontWeight: 700, fontSize: 17, cursor: "pointer" }}
          >
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
