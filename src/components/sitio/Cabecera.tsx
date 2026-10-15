"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LOGO } from "@/lib/fotos";

/* La barra del sitio: el logo, cuatro enlaces y una acción. Sin vidrio ni píldora flotante: una
   franja negra que se queda arriba. En el teléfono los enlaces se abren en un panel sólido. */

const ENLACES = [
  { href: "/#mesas", texto: "Las mesas" },
  { href: "/#tarifas", texto: "Tarifas" },
  { href: "/#ubicacion", texto: "Cómo llegar" },
  { href: "/mi-reserva", texto: "Mi reserva" },
];

export function Cabecera() {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", cerrar);
    return () => window.removeEventListener("keydown", cerrar);
  }, [abierto]);

  return (
    <header className="cabecera">
      <div className="cabecera__fila">
        <Link href="/" className="cabecera__logo" aria-label="Billares Club 8, inicio" onClick={() => setAbierto(false)}>
          <Image src={LOGO} alt="" width={110} height={64} preload />
        </Link>

        <nav className="cabecera__nav" aria-label="Principal">
          {ENLACES.map((e) => (
            <Link key={e.href} href={e.href} className="cabecera__enlace">
              {e.texto}
            </Link>
          ))}
        </nav>

        <div className="cabecera__acciones">
          <Link href="/reservar" className="boton">
            Reservar mesa
          </Link>
          <button
            type="button"
            className="cabecera__menu"
            aria-expanded={abierto}
            aria-controls="menu-movil"
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      <nav id="menu-movil" className="cabecera__movil" data-abierto={abierto || undefined} aria-label="Principal en el teléfono">
        {ENLACES.map((e) => (
          <Link key={e.href} href={e.href} onClick={() => setAbierto(false)}>
            {e.texto}
          </Link>
        ))}
      </nav>
    </header>
  );
}
