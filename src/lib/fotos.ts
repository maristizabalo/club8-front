/* Las fotografías del club.
 *
 * Son las del sitio anterior de Billares Club 8, copiadas a /public/fotos para no depender de su
 * CDN. Ancho y alto son los reales de cada archivo. */

export type Foto = { src: string; alt: string; ancho: number; alto: number };

function foto(archivo: string, alt: string, ancho: number, alto: number): Foto {
  return { src: `/fotos/${archivo}`, alt, ancho, alto };
}

export const LOGO = "/fotos/logo.png";

export const FOTOS = {
  salon: foto("salon.jpg", "El salón de Club 8 con sus mesas de paño azul", 1584, 672),
  mesa: foto("mesa-jimar.jpg", "Mesa Jimar de tres bandas con las tres bolas sobre el paño", 1080, 1080),
  edificio: foto("edificio.jpg", "El edificio de Club 8 en la Calle 63 de noche", 1080, 1080),
  jugadores: foto("jugadores.jpg", "Jugadores en las mesas de Club 8", 1080, 1080),
  taco: foto("jugador-apunta.jpg", "Un jugador apunta sobre la mesa", 2048, 1374),
  amarillo: foto("camisetas-amarillas.jpg", "Dos jugadores con camiseta amarilla junto al 8 del club", 1440, 925),
  grupo: foto("grupo-amigos.jpg", "Un grupo de amigos celebra junto a una mesa", 1440, 928),
  musica: foto("musica-en-vivo.jpg", "Música en vivo en el club", 1440, 950),
  tiro: foto("tiro.jpg", "Un jugador se inclina sobre la mesa para el tiro", 1440, 959),
  traje: foto("jugador-corbata.jpg", "Un jugador de corbata prepara la jugada", 1440, 962),
  risa: foto("jugador-sonrie.jpg", "Un jugador sonríe en la mesa", 1440, 960),
  charla: foto("charla.jpg", "Jugadores conversan entre partidas", 1440, 962),
  barra: foto("zona-descanso.jpg", "Clientes en la zona de descanso", 1440, 928),
  mesaCafe: foto("mesa-cafe-bar.jpg", "Una mesa de amigos en el café bar", 1440, 942),
  cartas: foto("partida-cartas.jpg", "Partida de cartas en el café bar", 1440, 950),
  sala: foto("salon-mesas.jpg", "Vista del salón con las mesas en juego", 1440, 938),
} as const;
