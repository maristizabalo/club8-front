"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { mensajeDe } from "@/lib/api";
import { useSesion } from "@/lib/sesion";

/* Dos ganchos que usan todas las pantallas del panel.
 *
 * useCarga pide datos y los vuelve a pedir cuando cambia la clave o cuando alguien llama a
 * recargar. Mientras llega lo nuevo deja visible lo anterior: el panel no parpadea en blanco cada
 * treinta segundos. Si la sesión venció, la cierra.
 *
 * useAhora da la hora y la refresca sola, para los relojes de las partidas en curso. */

export function useCarga<T>(cargar: () => Promise<T>, clave: string, cadaMs?: number) {
  const { atender } = useSesion();
  const fn = useRef(cargar);
  const [vuelta, setVuelta] = useState(0);
  const [estado, setEstado] = useState<{ id: string; datos: T | null; error: string }>({ id: "", datos: null, error: "" });

  useEffect(() => {
    fn.current = cargar;
  });

  const id = `${clave}#${vuelta}`;

  useEffect(() => {
    let vivo = true;
    fn.current()
      .then((datos) => {
        if (vivo) setEstado({ id, datos, error: "" });
      })
      .catch((e: unknown) => {
        if (!vivo || atender(e)) return;
        setEstado((s) => ({ id, datos: s.datos, error: mensajeDe(e) }));
      });
    return () => {
      vivo = false;
    };
  }, [id, atender]);

  useEffect(() => {
    if (!cadaMs) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") setVuelta((v) => v + 1);
    }, cadaMs);
    return () => window.clearInterval(t);
  }, [cadaMs]);

  const recargar = useCallback(() => setVuelta((v) => v + 1), []);

  return { datos: estado.datos, error: estado.error, cargando: estado.id !== id, recargar };
}

export function useAhora(cadaMs = 30000) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setAhora(Date.now()), cadaMs);
    return () => window.clearInterval(t);
  }, [cadaMs]);
  return ahora;
}

/** Corre una acción del panel: marca ocupado, muestra el error si falla y recarga si sale bien. */
export function useAccion() {
  const { atender } = useSesion();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  const correr = useCallback(
    async <R,>(accion: () => Promise<R>, alTerminar?: (r: R) => void) => {
      setOcupado(true);
      setError("");
      try {
        const r = await accion();
        alTerminar?.(r);
        return true;
      } catch (e) {
        if (!atender(e)) setError(mensajeDe(e));
        return false;
      } finally {
        setOcupado(false);
      }
    },
    [atender],
  );

  return { ocupado, error, setError, correr };
}
