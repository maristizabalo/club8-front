"use client";

import { useEffect } from "react";

/* Las entradas al hacer scroll. Cada pieza marcada con .entra sube y aparece una vez cuando su
   sección llega a la pantalla, escalonada por --orden.

   Sin JavaScript no pasa nada malo: la clase que esconde las piezas la pone este efecto, así que
   el contenido nunca queda invisible si el script no corre. Con movimiento reducido, todo aparece
   quieto. */
export function Movimiento() {
  useEffect(() => {
    const raiz = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const piezas = Array.from(document.querySelectorAll<HTMLElement>(".entra"));
    if (piezas.length === 0 || !("IntersectionObserver" in window)) return;

    // Lo que ya se ve al cargar no se esconde: aparecería con un parpadeo.
    const alto = window.innerHeight;
    for (const p of piezas) {
      if (p.getBoundingClientRect().top < alto * 0.92) p.classList.add("visible");
    }
    raiz.dataset.mov = "listo";

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    for (const p of piezas) if (!p.classList.contains("visible")) obs.observe(p);

    return () => {
      obs.disconnect();
      delete raiz.dataset.mov;
    };
  }, []);

  return null;
}
