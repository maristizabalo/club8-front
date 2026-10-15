/* Las fotografías del club.
 *
 * Son las del sitio actual de Billares Club 8 y hoy se sirven desde su CDN. Antes de redirigir
 * billaresclub8.com hacia este sitio hay que copiarlas a /public/fotos y cambiar estas rutas: si
 * el plan del sitio viejo se cancela, el CDN deja de servirlas. */

const CDN = "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1600/6YbySCTTwZ6wVpFp";

export type Foto = { src: string; alt: string; ancho: number; alto: number };

function foto(archivo: string, alt: string, ancho: number, alto: number): Foto {
  return { src: `${CDN}/${archivo}`, alt, ancho, alto };
}

export const LOGO = "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=375,fit=crop/6YbySCTTwZ6wVpFp/logos-club-8-4-RItfeC8qAYLJLzLG.png";

export const FOTOS = {
  salon: foto("portada-billares-club-8-b-pEJQoDHbn5JQCl5j.png", "El salón de Club 8 con sus mesas de paño azul", 1600, 678),
  mesa: foto("mesas-jimar-3-bandas-s3Jy4ReC5sfBmxL5.jpg", "Mesa Jimar de tres bandas con las tres bolas sobre el paño", 1600, 1600),
  edificio: foto("edificio-club-8-MCWIQZVoqb7v2jSR.jpg", "El edificio de Club 8 en la Calle 63 de noche", 1600, 1600),
  jugadores: foto("club-8---bogota-cWywFgrLCYZMlI7K.jpg", "Jugadores en las mesas de Club 8", 1600, 1600),
  taco: foto("487154489_1065903555566758_8759126682913475570_n-sneY7sSrdfccakBt.jpg", "Un jugador apunta sobre la mesa", 1600, 1072),
  amarillo: foto("481357303_18351844462182335_5510528486523458829_n-Aw3EkmFBzafMVrgV.jpg", "Dos jugadores con camiseta amarilla junto al 8 del club", 1600, 1024),
  grupo: foto("474113531_18347871871182335_4447188911427280544_n-6lFx4xENfkscyqEC.jpg", "Un grupo de amigos celebra junto a una mesa", 1600, 1028),
  musica: foto("470228986_18343022650182335_4070726295649595197_n-ctsXgTohwg2eNBex.jpg", "Música en vivo en el club", 1600, 1052),
  tiro: foto("470218161_18343019809182335_3855004471141615393_n-6DdlKpR0DqJBU5yu.jpg", "Un jugador se inclina sobre la mesa para el tiro", 1600, 1064),
  traje: foto("470217305_18343021288182335_2328878387923284850_n-LGbmaqMSATwkGwKd.jpg", "Un jugador de corbata prepara la jugada", 1600, 1068),
  risa: foto("470206866_18343019824182335_7178235711451321250_n-LKKw9FG9qetu7zuU.jpg", "Un jugador sonríe en la mesa", 1600, 1064),
  charla: foto("470183422_18343021273182335_5546485377049676296_n-qIRpbGGpcbGlNTvk.jpg", "Jugadores conversan entre partidas", 1600, 1068),
  barra: foto("470181196_18343020742182335_1766474749305549028_n-7QRwCnLiZHKQIBOw.jpg", "Clientes en la zona de descanso", 1600, 1028),
  mesaCafe: foto("470177968_18343022953182335_3871373901024208723_n-AqPtuOeuP1Blgl3f.jpg", "Una mesa de amigos en el café bar", 1600, 1052),
  cartas: foto("470176804_18343023868182335_7606890429423281315_n-yGzjqKdadbhQafWE.jpg", "Partida de cartas en el café bar", 1600, 1052),
  sala: foto("470191846_18343022926182335_7278258351072409766_n-uKb4qLYZshxbHD6x.jpg", "Vista del salón con las mesas en juego", 1600, 1040),
} as const;
