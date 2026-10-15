import { useId } from "react";

/* Una mesa de carambola vista desde arriba: baranda, paño, los diamantes de la baranda (los que
   usa el sistema de tres bandas para calcular el tiro) y, si está en juego, las tres bolas.
   Sin troneras: en tres bandas no hay huecos.

   Se dibuja en el sentido que tenga en el salón, y el número siempre queda derecho. */

export type TonoMesa = "vivo" | "hondo" | "apagado" | "rayado" | "fuera";

const PANO: Record<TonoMesa, string> = {
  vivo: "var(--pano-vivo)",
  hondo: "var(--pano)",
  apagado: "var(--pano-apagado)",
  rayado: "var(--humo)",
  fuera: "var(--grafito)",
};

export function MesaBillar({
  numero,
  vertical = false,
  tono = "vivo",
  bolas = false,
  baranda,
}: {
  numero: number | string;
  vertical?: boolean;
  tono?: TonoMesa;
  bolas?: boolean;
  /** Color de la baranda. Dorada cuando la mesa está elegida. */
  baranda?: string;
}) {
  const id = useId().replace(/:/g, "");
  const W = vertical ? 100 : 200;
  const H = vertical ? 200 : 100;
  const borde = 11;
  const largo = vertical ? H - borde * 2 : W - borde * 2;
  const corto = vertical ? W - borde * 2 : H - borde * 2;

  // Siete diamantes en las bandas largas y tres en las cortas, a distancias iguales.
  const diamantes: Array<[number, number]> = [];
  for (let i = 1; i <= 7; i++) {
    const a = borde + (largo * i) / 8;
    if (vertical) {
      diamantes.push([borde / 2, a], [W - borde / 2, a]);
    } else {
      diamantes.push([a, borde / 2], [a, H - borde / 2]);
    }
  }
  for (let i = 1; i <= 3; i++) {
    const a = borde + (corto * i) / 4;
    if (vertical) {
      diamantes.push([a, borde / 2], [a, H - borde / 2]);
    } else {
      diamantes.push([borde / 2, a], [W - borde / 2, a]);
    }
  }

  // Las bolas en proporción del paño, giradas si la mesa va vertical.
  const enPano = (fl: number, fc: number): [number, number] =>
    vertical ? [borde + corto * fc, borde + largo * fl] : [borde + largo * fl, borde + corto * fc];
  const posBolas: Array<[string, [number, number]]> = [
    ["var(--bola-blanca)", enPano(0.2, 0.68)],
    ["var(--bola-amarilla)", enPano(0.78, 0.3)],
    ["var(--bola-roja)", enPano(0.66, 0.72)],
  ];

  const rayado = tono === "rayado" || tono === "fuera";
  const numeroColor = tono === "apagado" || rayado ? "var(--tiza-2)" : "var(--tiza)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mesa-svg" aria-hidden="true" focusable="false">
      {rayado ? (
        <defs>
          <pattern id={`r${id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill={PANO[tono]} />
            <rect width="4" height="10" fill="var(--hierro)" />
          </pattern>
        </defs>
      ) : null}
      <rect x="0" y="0" width={W} height={H} rx="8" fill={baranda ?? "var(--baranda, #2c2b30)"} />
      <rect
        x={borde}
        y={borde}
        width={W - borde * 2}
        height={H - borde * 2}
        rx="2"
        fill={rayado ? `url(#r${id})` : PANO[tono]}
      />
      {diamantes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.9" fill={baranda ? "var(--negro)" : "var(--oro)"} />
      ))}
      {bolas
        ? posBolas.map(([color, [x, y]]) => <circle key={color} cx={x} cy={y} r="5" fill={color} />)
        : null}
      <text
        x={W / 2}
        y={H / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={vertical ? 40 : 46}
        fontWeight="800"
        fill={numeroColor}
        style={{ fontFamily: "var(--fuente)", letterSpacing: "-0.03em" }}
      >
        {numero}
      </text>
    </svg>
  );
}
