"use client";

import { useState, type ReactNode } from "react";

import { api } from "@/lib/api";
import { nombreDia, pesos } from "@/lib/formato";
import type { Ajustes, Franja, Horario } from "@/lib/tipos";

import { useAccion, useCarga } from "./ganchos";

/* Lo que el club cambia sin llamar a nadie: su perfil, los datos para el anticipo, las reglas de
   reserva, el horario y las tarifas. Cada bloque se guarda por separado. Lo que se guarda aquí se
   ve en el sitio a más tardar en cinco minutos. */

export function EditorAjustes() {
  const ajustes = useCarga(() => api.ajustes(), "ajustes");
  const horario = useCarga(() => api.horario(), "horario");
  const franjas = useCarga(() => api.franjas(), "franjas");

  return (
    <div className="pn-pagina">
      <header className="pn-cabeza">
        <div>
          <h1 className="pn-titulo">Ajustes</h1>
          <p className="pn-nota">Los cambios se ven en el sitio público en un máximo de cinco minutos.</p>
        </div>
      </header>
      {ajustes.error ? (
        <p className="aviso" role="alert">
          {ajustes.error}
        </p>
      ) : null}
      {ajustes.datos ? <FormAjustes key={JSON.stringify(ajustes.datos)} inicial={ajustes.datos} onGuardado={ajustes.recargar} /> : null}
      {horario.datos ? <FormHorario key={JSON.stringify(horario.datos)} inicial={horario.datos} onGuardado={horario.recargar} /> : null}
      {franjas.datos ? <FormFranjas key={JSON.stringify(franjas.datos)} inicial={franjas.datos} onGuardado={franjas.recargar} /> : null}
    </div>
  );
}

function Bloque({ titulo, children, nota }: { titulo: string; children: ReactNode; nota?: string }) {
  return (
    <section className="pn-tarjeta pn-form">
      <div>
        <h2 className="pn-subtitulo">{titulo}</h2>
        {nota ? <p className="pn-nota">{nota}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Texto({ etiqueta, valor, onCambio, tipo = "text" }: { etiqueta: string; valor: string; onCambio: (v: string) => void; tipo?: string }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      <input className="entrada" type={tipo} value={valor} onChange={(e) => onCambio(e.target.value)} />
    </label>
  );
}

function Numero({ etiqueta, valor, onCambio, min, max, ayuda }: { etiqueta: string; valor: number; onCambio: (v: number) => void; min: number; max: number; ayuda?: string }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      <input className="entrada cifras" type="number" min={min} max={max} value={valor} onChange={(e) => onCambio(Number(e.target.value))} />
      {ayuda ? <span className="campo__ayuda">{ayuda}</span> : null}
    </label>
  );
}

function FormAjustes({ inicial, onGuardado }: { inicial: Ajustes; onGuardado: () => void }) {
  const accion = useAccion();
  const [a, setA] = useState(inicial);
  const [guardado, setGuardado] = useState(false);
  const set = <K extends keyof Ajustes>(k: K, v: Ajustes[K]) => {
    setGuardado(false);
    setA({ ...a, [k]: v });
  };

  const guardar = () =>
    accion.correr(
      () => api.guardarAjustes(a),
      () => {
        setGuardado(true);
        onGuardado();
      },
    );

  const pie = (
    <div className="pn-form__acciones">
      <button type="button" className="pn-boton pn-boton--oro" onClick={guardar} disabled={accion.ocupado}>
        Guardar
      </button>
      {guardado ? <span className="pn-nota">Guardado.</span> : null}
      {accion.error ? <span className="campo__error">{accion.error}</span> : null}
    </div>
  );

  return (
    <>
      <Bloque titulo="Perfil del club">
        <div className="pn-form__fila">
          <Texto etiqueta="Nombre" valor={a.clubName} onCambio={(v) => set("clubName", v)} />
          <Texto etiqueta="Frase corta" valor={a.tagline} onCambio={(v) => set("tagline", v)} />
          <Texto etiqueta="Dirección" valor={a.address} onCambio={(v) => set("address", v)} />
          <Texto etiqueta="Barrio" valor={a.neighborhood} onCambio={(v) => set("neighborhood", v)} />
          <Texto etiqueta="Ciudad" valor={a.city} onCambio={(v) => set("city", v)} />
          <Texto etiqueta="Enlace del mapa" valor={a.mapsUrl} onCambio={(v) => set("mapsUrl", v)} tipo="url" />
          <Texto etiqueta="WhatsApp (con indicativo)" valor={a.whatsapp} onCambio={(v) => set("whatsapp", v)} tipo="tel" />
          <Texto etiqueta="Teléfono como se muestra" valor={a.phoneDisplay} onCambio={(v) => set("phoneDisplay", v)} />
          <Texto etiqueta="Correo" valor={a.email} onCambio={(v) => set("email", v)} tipo="email" />
          <Texto etiqueta="Instagram" valor={a.instagram} onCambio={(v) => set("instagram", v)} tipo="url" />
          <Texto etiqueta="Facebook" valor={a.facebook} onCambio={(v) => set("facebook", v)} tipo="url" />
          <Texto etiqueta="TikTok" valor={a.tiktok} onCambio={(v) => set("tiktok", v)} tipo="url" />
        </div>
        <label className="pn-interruptor">
          <input type="checkbox" checked={a.parking} onChange={(e) => set("parking", e.target.checked)} />
          <span>El club tiene parqueadero</span>
        </label>
        {pie}
      </Bloque>

      <Bloque
        titulo="Datos para el anticipo"
        nota="Se muestran al cliente al terminar la reserva. Si quedan vacíos, el sitio dice que se los envían por WhatsApp."
      >
        <div className="pn-form__fila">
          <Texto etiqueta="Llave (Bre-B)" valor={a.paymentKey} onCambio={(v) => set("paymentKey", v)} />
          <Texto etiqueta="Banco y tipo de cuenta" valor={a.paymentBank} onCambio={(v) => set("paymentBank", v)} />
          <Texto etiqueta="Número de cuenta" valor={a.paymentAccount} onCambio={(v) => set("paymentAccount", v)} />
          <Texto etiqueta="Titular" valor={a.paymentHolder} onCambio={(v) => set("paymentHolder", v)} />
        </div>
        {pie}
      </Bloque>

      <Bloque titulo="Reglas de reserva">
        <div className="pn-form__fila">
          <Numero etiqueta="Horas mínimas" valor={a.minHours} min={1} max={12} onCambio={(v) => set("minHours", v)} />
          <Numero etiqueta="Horas máximas por la web" valor={a.maxHours} min={1} max={12} onCambio={(v) => set("maxHours", v)} />
          <Numero etiqueta="Jugadores por mesa" valor={a.maxPlayers} min={1} max={12} onCambio={(v) => set("maxPlayers", v)} />
          <Numero
            etiqueta="Anticipación mínima"
            valor={a.leadMinutes}
            min={0}
            max={10080}
            onCambio={(v) => set("leadMinutes", v)}
            ayuda="En minutos. Con 60, a las 7:10 p. m. ya no se reserva las 8:00 p. m."
          />
          <Numero etiqueta="Días que abre la agenda" valor={a.horizonDays} min={1} max={365} onCambio={(v) => set("horizonDays", v)} />
          <Numero
            etiqueta="Cancelación por la web hasta"
            valor={a.cancelHours}
            min={0}
            max={168}
            onCambio={(v) => set("cancelHours", v)}
            ayuda="Horas antes de la reserva."
          />
          <Numero
            etiqueta="Aviso de reserva próxima"
            valor={a.upcomingAlertMin}
            min={0}
            max={1440}
            onCambio={(v) => set("upcomingAlertMin", v)}
            ayuda="Minutos antes. La mesa avisa en el panel si sigue en juego."
          />
        </div>
        {pie}
      </Bloque>
    </>
  );
}

function FormHorario({ inicial, onGuardado }: { inicial: Horario[]; onGuardado: () => void }) {
  const accion = useAccion();
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const [h, setH] = useState(() =>
    orden.map((d) => inicial.find((x) => x.weekday === d) ?? { weekday: d, open: "09:00", close: "24:00", closed: true }),
  );
  const cambiar = (d: number, c: Partial<Horario>) => setH(h.map((x) => (x.weekday === d ? { ...x, ...c } : x)));

  return (
    <Bloque titulo="Horario de atención" nota='El cierre puede ser "24:00" (medianoche). Las reservas deben caber dentro del horario.'>
      <table className="pn-tabla pn-tabla--formulario">
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Abre</th>
            <th scope="col">Abre a las</th>
            <th scope="col">Cierra a las</th>
          </tr>
        </thead>
        <tbody>
          {h.map((x) => (
            <tr key={x.weekday}>
              <th scope="row">{nombreDia(x.weekday).replace(/^./, (c) => c.toUpperCase())}</th>
              <td>
                <input
                  type="checkbox"
                  checked={!x.closed}
                  onChange={(e) => cambiar(x.weekday, { closed: !e.target.checked })}
                  aria-label={`Abre el ${nombreDia(x.weekday)}`}
                />
              </td>
              <td>
                <input
                  className="entrada cifras"
                  value={x.open}
                  disabled={x.closed}
                  pattern="\d{2}:\d{2}"
                  onChange={(e) => cambiar(x.weekday, { open: e.target.value })}
                  aria-label={`Apertura del ${nombreDia(x.weekday)}`}
                />
              </td>
              <td>
                <input
                  className="entrada cifras"
                  value={x.close}
                  disabled={x.closed}
                  pattern="\d{2}:\d{2}"
                  onChange={(e) => cambiar(x.weekday, { close: e.target.value })}
                  aria-label={`Cierre del ${nombreDia(x.weekday)}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pn-form__acciones">
        <button type="button" className="pn-boton pn-boton--oro" disabled={accion.ocupado} onClick={() => accion.correr(() => api.guardarHorario(h), onGuardado)}>
          Guardar horario
        </button>
        {accion.error ? <span className="campo__error">{accion.error}</span> : null}
      </div>
    </Bloque>
  );
}

function FormFranjas({ inicial, onGuardado }: { inicial: Franja[]; onGuardado: () => void }) {
  const accion = useAccion();
  const [f, setF] = useState<Franja[]>(inicial);
  const cambiar = (i: number, c: Partial<Franja>) => setF(f.map((x, j) => (j === i ? { ...x, ...c } : x)));

  return (
    <Bloque
      titulo="Franjas y tarifas"
      nota="El anticipo de una reserva es el valor de una hora de la franja en la que empieza; si la franja se cobra por bloque, el bloque completo. Una hora sin franja se muestra como tarifa por confirmar."
    >
      <table className="pn-tabla pn-tabla--formulario">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Desde</th>
            <th scope="col">Hasta</th>
            <th scope="col">Precio</th>
            <th scope="col">Se cobra</th>
            <th scope="col">Nota</th>
            <th scope="col">
              <span className="solo-lector">Quitar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {f.map((x, i) => (
            <tr key={i}>
              <td>
                <input className="entrada" value={x.name} onChange={(e) => cambiar(i, { name: e.target.value })} aria-label="Nombre de la franja" />
              </td>
              <td>
                <input className="entrada cifras" value={x.starts} onChange={(e) => cambiar(i, { starts: e.target.value })} aria-label="Desde" />
              </td>
              <td>
                <input className="entrada cifras" value={x.ends} onChange={(e) => cambiar(i, { ends: e.target.value })} aria-label="Hasta" />
              </td>
              <td>
                <input
                  className="entrada cifras"
                  type="number"
                  min={0}
                  step={500}
                  value={x.price}
                  onChange={(e) => cambiar(i, { price: Number(e.target.value) })}
                  aria-label={`Precio (${pesos(x.price)})`}
                />
              </td>
              <td>
                <select className="entrada" value={x.unit} onChange={(e) => cambiar(i, { unit: e.target.value as Franja["unit"] })} aria-label="Se cobra">
                  <option value="hora">Por hora</option>
                  <option value="bloque">Por bloque</option>
                </select>
              </td>
              <td>
                <input className="entrada" value={x.note} onChange={(e) => cambiar(i, { note: e.target.value })} aria-label="Nota" />
              </td>
              <td>
                <button type="button" className="pn-boton pn-boton--plano" onClick={() => setF(f.filter((_, j) => j !== i))}>
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pn-form__acciones">
        <button
          type="button"
          className="pn-boton pn-boton--plano"
          onClick={() => setF([...f, { name: "Nueva franja", starts: "17:00", ends: "18:00", price: 0, unit: "hora", note: "" }])}
        >
          Agregar franja
        </button>
        <button type="button" className="pn-boton pn-boton--oro" disabled={accion.ocupado} onClick={() => accion.correr(() => api.guardarFranjas(f), onGuardado)}>
          Guardar tarifas
        </button>
        {accion.error ? <span className="campo__error">{accion.error}</span> : null}
      </div>
    </Bloque>
  );
}
