"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

import { mensajeDe } from "@/lib/api";
import { LOGO } from "@/lib/fotos";
import { useSesion } from "@/lib/sesion";

export default function Ingresar() {
  const { ingresar } = useSesion();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await ingresar(correo, clave);
    } catch (err) {
      setError(mensajeDe(err));
      setEnviando(false);
    }
  };

  return (
    <div className="pn-ingreso">
      <form className="pn-ingreso__caja" onSubmit={enviar}>
        <Image src={LOGO} alt="Billares Club 8" width={120} height={70} />
        <h1 className="pn-titulo">Panel del club</h1>
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="i-correo">
            Correo
          </label>
          <input
            id="i-correo"
            className="entrada"
            type="email"
            autoComplete="username"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="i-clave">
            Contraseña
          </label>
          <input
            id="i-clave"
            className="entrada"
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </div>
        {error ? (
          <p className="aviso" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="boton boton--grande" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
