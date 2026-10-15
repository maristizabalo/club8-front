import { cacheLife } from "next/cache";
import Link from "next/link";

import { hora12 } from "@/lib/formato";
import type { Club } from "@/lib/tipos";

import { IconoWhatsApp } from "./Iconos";
import { horarioAgrupado } from "./horario";

/* El cierre del sitio: el nombre del club a todo el ancho y, debajo, lo que alguien busca al
   final de una página: dónde queda, a qué hora abre y cómo escribir. */

/* El año del pie sale de una función en caché: con Cache Components, leer el reloj durante el
   prerender exige marcar la página como dinámica, y por un año no vale la pena. */
async function anioActual() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Pie({ club }: { club: Club }) {
  const anio = await anioActual();
  const s = club.settings;
  const grupos = horarioAgrupado(club.hours);
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hola Club 8, tengo una pregunta.")}` : "";

  return (
    <footer className="pie">
      <p className="pie__nombre" aria-hidden="true">
        Club 8
      </p>

      <div className="pie__rejilla">
        <div>
          <h2 className="pie__titulo">Dónde</h2>
          <p>
            {s.address}
            <br />
            {s.neighborhood}, {s.city}
          </p>
          {s.mapsUrl ? (
            <a className="enlace" href={s.mapsUrl} target="_blank" rel="noreferrer">
              Abrir en el mapa
            </a>
          ) : null}
        </div>

        <div>
          <h2 className="pie__titulo">Cuándo</h2>
          <ul>
            {grupos.map((g) => (
              <li key={g.dias}>
                {g.dias}: {g.cerrado ? "cerrado" : `${hora12(g.abre)} a ${hora12(g.cierra)}`}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="pie__titulo">Escríbenos</h2>
          {wa ? (
            <a className="pie__wa" href={wa} target="_blank" rel="noreferrer">
              <IconoWhatsApp /> {s.phoneDisplay || s.whatsapp}
            </a>
          ) : null}
          <ul className="pie__redes">
            {s.instagram ? (
              <li>
                <a className="enlace" href={s.instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            ) : null}
            {s.facebook ? (
              <li>
                <a className="enlace" href={s.facebook} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
            ) : null}
            {s.tiktok ? (
              <li>
                <a className="enlace" href={s.tiktok} target="_blank" rel="noreferrer">
                  TikTok
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="pie__titulo">Tu reserva</h2>
          <ul>
            <li>
              <Link className="enlace" href="/reservar">
                Reservar una mesa
              </Link>
            </li>
            <li>
              <Link className="enlace" href="/mi-reserva">
                Consultar o cancelar
              </Link>
            </li>
            <li>
              <Link className="enlace" href="/admin">
                Ingreso del personal
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <p className="pie__legal">
        © {anio} {s.clubName} · {s.address}, {s.city}
      </p>
    </footer>
  );
}
