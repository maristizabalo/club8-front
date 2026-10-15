import type { Metadata } from "next";
import { Suspense } from "react";

import { Reservador } from "@/components/reserva/Reservador";
import { cargarClub } from "@/lib/club";
import type { Club } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Reservar mesa",
  description: "Elige el día, mira el plano del salón y reserva tu mesa de tres bandas en Billares Club 8.",
};

/* La página lee la URL (?fecha=&mesa=&hora=) dentro de un Suspense: con Cache Components, lo que
   depende de la petición se resuelve al pedirla y el resto de la página sale ya armado. */
export default async function PaginaReservar({ searchParams }: PageProps<"/reservar">) {
  const { club } = await cargarClub();
  return (
    <div className="interior">
      <Suspense fallback={<Esqueleto />}>
        <ConUrl club={club} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ConUrl({ club, searchParams }: { club: Club; searchParams: PageProps<"/reservar">["searchParams"] }) {
  const q = await searchParams;
  const texto = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(texto(q.fecha)) ? texto(q.fecha) : undefined;
  const hora = /^\d{2}:\d{2}$/.test(texto(q.hora)) ? texto(q.hora) : undefined;
  const mesa = Number.parseInt(texto(q.mesa), 10);
  return <Reservador club={club} inicial={{ fecha, hora, mesa: Number.isFinite(mesa) ? mesa : undefined }} />;
}

function Esqueleto() {
  return (
    <div className="reservador" aria-busy="true">
      <div className="reservador__cabeza">
        <h1 className="interior__titulo">Reserva tu mesa</h1>
        <p className="interior__bajada">Cargando el plano del salón…</p>
      </div>
    </div>
  );
}
