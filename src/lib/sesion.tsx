"use client";

/* Sesión del personal.
 *
 * Una sola pieza responde las tres preguntas que hace cada pantalla del panel: quién entró, qué
 * puede hacer y qué pasa cuando el token deja de valer. Vive en el cliente porque el token vive
 * en el navegador: el servidor de Next nunca lo ve. */

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { ErrorAPI, api, borrarToken, guardarToken, leerToken } from "./api";
import type { Permiso, Usuario } from "./tipos";

export const RUTA_INGRESO = "/admin/ingresar";
export const RUTA_PANEL = "/admin";

export type EstadoSesion = {
  usuario: Usuario | null;
  permisos: Permiso[];
  /** Cierto mientras no se sabe todavía si hay sesión. */
  cargando: boolean;
  /** Un botón que el rol no puede pulsar no se dibuja. */
  puede: (permiso: Permiso) => boolean;
  ingresar: (correo: string, clave: string) => Promise<void>;
  salir: () => void;
  /** Devuelve cierto si el error era una sesión vencida y ya se cerró por él. */
  atender: (error: unknown) => boolean;
};

const Contexto = createContext<EstadoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const ruta = usePathname() ?? RUTA_PANEL;
  const enIngreso = ruta === RUTA_INGRESO;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  // El token ya validado: así cambiar de pantalla no vuelve a preguntar quién soy.
  const validado = useRef<string | null>(null);

  const olvidar = useCallback(() => {
    borrarToken();
    validado.current = null;
    setUsuario(null);
    setPermisos([]);
  }, []);

  const salir = useCallback(() => {
    olvidar();
    router.replace(RUTA_INGRESO);
  }, [olvidar, router]);

  const atender = useCallback(
    (error: unknown) => {
      if (error instanceof ErrorAPI && error.esSesionCaducada) {
        salir();
        return true;
      }
      return false;
    },
    [salir],
  );

  useEffect(() => {
    const token = leerToken();
    let vivo = true;

    if (!token || validado.current === token) {
      // Se resuelve en una microtarea para no pintar dos veces en el mismo efecto.
      queueMicrotask(() => {
        if (!vivo) return;
        if (!token) {
          olvidar();
          if (!enIngreso) router.replace(RUTA_INGRESO);
        }
        setCargando(false);
      });
      return () => {
        vivo = false;
      };
    }

    api
      .yo()
      .then((s) => {
        if (!vivo) return;
        validado.current = token;
        setUsuario(s.user);
        setPermisos(s.permissions ?? []);
      })
      .catch((error: unknown) => {
        if (!vivo) return;
        // 401 es "este token ya no vale". Una caída de red no es una expulsión.
        if (error instanceof ErrorAPI && error.esSesionCaducada) {
          olvidar();
          if (!enIngreso) router.replace(RUTA_INGRESO);
        }
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [enIngreso, olvidar, router]);

  const ingresar = useCallback(
    async (correo: string, clave: string) => {
      const s = await api.ingresar(correo.trim(), clave);
      if (s.token) {
        guardarToken(s.token);
        validado.current = s.token;
      }
      setUsuario(s.user);
      setPermisos(s.permissions ?? []);
      setCargando(false);
      router.replace(RUTA_PANEL);
    },
    [router],
  );

  const valor = useMemo<EstadoSesion>(
    () => ({ usuario, permisos, cargando, puede: (p) => permisos.includes(p), ingresar, salir, atender }),
    [usuario, permisos, cargando, ingresar, salir, atender],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): EstadoSesion {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useSesion requiere que el árbol esté dentro de SesionProvider");
  return valor;
}
