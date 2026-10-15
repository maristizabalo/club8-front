import type { Metadata } from "next";

import { MiReserva } from "@/components/reserva/MiReserva";
import { cargarClub } from "@/lib/club";

export const metadata: Metadata = {
  title: "Mi reserva",
  description: "Consulta o cancela tu reserva en Billares Club 8 con el código y tu celular.",
};

export default async function PaginaMiReserva() {
  const { club } = await cargarClub();
  return (
    <div className="interior interior--angosto">
      <h1 className="interior__titulo">Mi reserva</h1>
      <p className="interior__bajada">Escribe el código que te dimos al reservar y el celular con el que lo hiciste.</p>
      <MiReserva whatsapp={club.settings.whatsapp} />
    </div>
  );
}
