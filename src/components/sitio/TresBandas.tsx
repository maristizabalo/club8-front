import type { CSSProperties } from "react";

/* Una carambola a tres bandas vista desde arriba: la bola blanca sale, toca tres bandas y llega a
   la roja después de tocar la amarilla. Es el dibujo de "cómo reservar": tres toques, como tres
   pasos. El recorrido se traza al entrar en pantalla (ver .tres__recorrido en sitio.css). */

export function TresBandas() {
  // Mesa de 400 × 200 con baranda de 18. El paño va de 18 a 382 en x y de 18 a 182 en y.
  const blanca: [number, number] = [96, 132];
  const amarilla: [number, number] = [150, 70];
  const banda1: [number, number] = [262, 18];
  const banda2: [number, number] = [382, 92];
  const banda3: [number, number] = [300, 182];
  const roja: [number, number] = [214, 128];
  const camino = [blanca, amarilla, banda1, banda2, banda3, roja].map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg className="tres" viewBox="0 0 400 200" role="img" aria-label="Recorrido de una carambola a tres bandas">
      <rect width="400" height="200" fill="#26262a" />
      <rect x="18" y="18" width="364" height="164" fill="var(--pano)" />
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <g key={i} fill="var(--oro)">
          <circle cx={18 + (364 * i) / 8} cy="9" r="2.6" />
          <circle cx={18 + (364 * i) / 8} cy="191" r="2.6" />
        </g>
      ))}
      {[1, 2, 3].map((i) => (
        <g key={i} fill="var(--oro)">
          <circle cx="9" cy={18 + (164 * i) / 4} r="2.6" />
          <circle cx="391" cy={18 + (164 * i) / 4} r="2.6" />
        </g>
      ))}
      <polyline className="tres__recorrido" points={camino} fill="none" stroke="var(--bola-blanca)" strokeWidth="2.4" pathLength={100} />
      {[banda1, banda2, banda3].map(([x, y], i) => (
        <circle key={i} className="tres__toque" style={{ "--orden": i } as CSSProperties} cx={x} cy={y} r="7" fill="var(--oro)" />
      ))}
      <circle cx={amarilla[0]} cy={amarilla[1]} r="9" fill="var(--bola-amarilla)" />
      <circle cx={roja[0]} cy={roja[1]} r="9" fill="var(--bola-roja)" />
      <circle cx={blanca[0]} cy={blanca[1]} r="9" fill="var(--bola-blanca)" />
    </svg>
  );
}
