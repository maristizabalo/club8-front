# Billares Club 8 — sitio y panel (Next.js)

Sitio público, reservas con plano de mesas y panel de operación de **Billares Club 8**
(Calle 63 # 15-32, Chapinero, Bogotá). Reemplaza a billaresclub8.com: la idea es redirigir ese
dominio aquí cuando esté listo.

La API vive en [club8-back](https://github.com/maristizabalo/club8-back).

## Qué hay

**Sitio**

- **Portada**: el plano del salón con la disponibilidad real de hoy. Se elige una hora y se ven las
  mesas libres; tocar una lleva directo a reservarla. Debajo: las mesas Jimar, las tarifas por
  franja dibujadas como el día del club, cómo reservar, el café bar del piso 5, torneos, ubicación y
  preguntas frecuentes.
- **Reservar** (`/reservar`): tira de días y calendario, el plano con cuántas horas le quedan a cada
  mesa ese día (y filtro por hora), y al tocar una mesa su agenda hora por hora. Se elige inicio y
  duración, se dejan nombre y celular, y sale el código con el anticipo y el botón para mandar el
  comprobante por WhatsApp. Lo elegido viaja en la URL (`?fecha=&mesa=&hora=`).
- **Mi reserva** (`/mi-reserva`): consultar y cancelar con código y celular.

**Panel** (`/admin`)

- **Hoy**: KPIs, el plano en vivo (libre, en juego con reloj, bloqueada, alerta si una reserva se
  acerca y la mesa sigue ocupada), acciones por mesa (ocupar sin reserva, "llegó" con reserva,
  finalizar, bloquear, reactivar), agenda del día por mesa y lista de reservas. Se refresca solo.
- **Reservas**: filtros por fechas, estado y búsqueda; detalle con historial, confirmar anticipo,
  no llegó, cancelar, cambiar mesa u hora.
- **Mesas**: arrastrar cada mesa a su lugar en el plano, orientación, fuera de servicio, bloqueos
  del salón completo (torneos, eventos).
- **Ajustes**: perfil, datos de pago del anticipo, reglas, horario y franjas.

## Arrancar

Necesitas **Node 20.9 o superior** (el repo trae `.nvmrc` con 24) y el backend corriendo.

```bash
npm install
npm run dev
```

Queda en `http://localhost:3000`. El navegador llama a `/api/...` del mismo origen y Next lo
reenvía a la API (`next.config.ts`), así que no hay CORS que configurar.

```bash
npm run lint
npm run typecheck
npm run build
```

## Variables

| Variable | Por defecto | Para qué |
| --- | --- | --- |
| `API_URL_INTERNA` | `http://localhost:8080` | Dónde está la API para el servidor de Next y para el reenvío de `/api` |
| `NEXT_PUBLIC_SITIO_URL` | `http://localhost:3000` | Dirección pública, para la vista previa al compartir |

## Cómo está hecho

- **Next.js 16.4 + React 19.3 + TypeScript**, App Router con **Cache Components** y
  **Partial Prefetching** activos. La portada es estática y se revalida cada 5 minutos
  (`lib/club.ts`, `'use cache'`); si la API no responde, usa los datos con los que nace el club en
  vez de caerse. `/reservar` es prerender parcial: la URL se lee dentro de un `<Suspense>`.
- **CSS propio sin framework** (`src/styles`): tokens con el negro del salón, el dorado del 8 y el
  azul del paño de las mesas; una sola familia tipográfica (Archivo, con eje de anchura).
- **El plano** (`components/plano`) es una sola pieza para el sitio, el panel y el editor. Las mesas
  se dibujan en SVG como mesas de carambola (baranda, paño, diamantes, sin troneras) y cada una es un
  botón accesible con teclado y lector de pantalla.
- `lib/api.ts` es la única puerta a la API; `lib/tipos.ts` es el contrato con el backend.

## Docker

```bash
docker build -t club8-front --build-arg API_URL_INTERNA=http://club8-back:8080 .
docker run -p 3000:3000 club8-front
```

La imagen usa la salida `standalone` de Next (`node server.js`).

## Pendientes antes de redirigir el dominio

- **Fotos**: hoy se cargan desde el CDN del sitio viejo (`lib/fotos.ts`). Hay que copiarlas a
  `public/fotos` y cambiar las rutas antes de cancelar ese sitio, o dejarán de verse.
- **Plano real**: acomodar las doce mesas, la barra y la entrada donde están de verdad.
- **Datos de pago y la tarifa de 5 a 6 p. m.**: cargarlos en Ajustes.
