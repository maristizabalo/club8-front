import type { EstadoReserva, MotivoBloqueo, OrigenReserva } from "@/lib/tipos";

/* Cómo se nombra cada estado en el panel y qué botón lo produce. Los nombres del botón son verbo
   y objeto: lo que pasa al pulsarlo. */

export const ESTADO: Record<EstadoReserva, string> = {
  PENDIENTE: "Pendiente de anticipo",
  CONFIRMADA: "Confirmada",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
  NO_PRESENTADO: "No llegó",
};

export const ACCION_ESTADO: Partial<Record<EstadoReserva, string>> = {
  CONFIRMADA: "Confirmar anticipo",
  ATENDIDA: "Marcar atendida",
  NO_PRESENTADO: "No llegó",
  CANCELADA: "Cancelar reserva",
};

export const ORIGEN: Record<OrigenReserva, string> = {
  web: "Sitio web",
  telefono: "Teléfono o WhatsApp",
  admin: "En el club",
};

export const MOTIVOS: Array<{ valor: MotivoBloqueo; texto: string }> = [
  { valor: "mantenimiento", texto: "Mantenimiento" },
  { valor: "danio", texto: "Daño" },
  { valor: "limpieza", texto: "Limpieza" },
  { valor: "torneo", texto: "Torneo" },
  { valor: "evento", texto: "Evento" },
  { valor: "uso_interno", texto: "Uso interno" },
  { valor: "otro", texto: "Otro" },
];

export const textoMotivo = (m: MotivoBloqueo) => MOTIVOS.find((x) => x.valor === m)?.texto ?? m;
