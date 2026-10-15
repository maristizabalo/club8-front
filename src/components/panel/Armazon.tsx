"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LOGO } from "@/lib/fotos";
import { RUTA_INGRESO, useSesion } from "@/lib/sesion";
import type { Permiso } from "@/lib/tipos";

/* El armazón del panel: navegación a la izquierda (arriba en el teléfono), quién está dentro y la
   pantalla. Mientras no se sabe si hay sesión no se pinta nada del panel: ni un parpadeo de datos
   ajenos ni botones que van a fallar. */

const SECCIONES: Array<{ href: string; texto: string; permiso?: Permiso }> = [
  { href: "/admin", texto: "Hoy" },
  { href: "/admin/reservas", texto: "Reservas" },
  { href: "/admin/mesas", texto: "Mesas", permiso: "ver:panel" },
  { href: "/admin/ajustes", texto: "Ajustes", permiso: "gestionar:club" },
];

const ROLES: Record<string, string> = { ADMINISTRADOR: "Administrador", OPERACION: "Operación", CONSULTA: "Consulta" };

export function Armazon({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const { usuario, cargando, salir, puede } = useSesion();

  if (ruta === RUTA_INGRESO) return <>{children}</>;

  if (cargando || !usuario) {
    return (
      <div className="pn-cargando" aria-busy="true">
        <p>Abriendo el panel…</p>
      </div>
    );
  }

  return (
    <div className="pn">
      <aside className="pn-lado">
        <Link href="/admin" className="pn-lado__logo" aria-label="Panel de Club 8">
          <Image src={LOGO} alt="" width={88} height={51} />
        </Link>
        <nav className="pn-lado__nav" aria-label="Panel">
          {SECCIONES.filter((s) => !s.permiso || puede(s.permiso)).map((s) => {
            const activa = s.href === "/admin" ? ruta === "/admin" : ruta?.startsWith(s.href);
            return (
              <Link key={s.href} href={s.href} className="pn-lado__enlace" aria-current={activa ? "page" : undefined}>
                {s.texto}
              </Link>
            );
          })}
        </nav>
        <div className="pn-lado__usuario">
          <p>
            <strong>{usuario.name}</strong>
            <br />
            <span>{ROLES[usuario.role] ?? usuario.role}</span>
          </p>
          <div className="pn-lado__acciones">
            <Link href="/" className="pn-boton pn-boton--plano" target="_blank">
              Ver sitio
            </Link>
            <button type="button" className="pn-boton pn-boton--plano" onClick={salir}>
              Salir
            </button>
          </div>
        </div>
      </aside>
      <main className="pn-contenido">{children}</main>
    </div>
  );
}
