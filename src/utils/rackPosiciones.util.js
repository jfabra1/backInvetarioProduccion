/**
 * Direcciones de posición dentro de un rack: fila -> letra (A, B, ... Z, AA, AB...),
 * columna -> número (1, 2, 3...). Ej: filas=3, columnas=4 -> A1..A4, B1..B4, C1..C4.
 */
const letraFila = (indiceCero) => {
  let n = indiceCero;
  let letra = "";
  do {
    letra = String.fromCharCode(65 + (n % 26)) + letra;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letra;
};

const indiceDeLetra = (letra) => {
  let indice = 0;
  for (const ch of letra) {
    indice = indice * 26 + (ch.charCodeAt(0) - 64);
  }
  return indice - 1; // 0-based
};

export const generarPosiciones = (filas, columnas) => {
  const posiciones = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 1; c <= columnas; c++) {
      posiciones.push(`${letraFila(f)}${c}`);
    }
  }
  return posiciones;
};

export const esPosicionValida = (posicion, filas, columnas) => {
  const match = /^([A-Z]+)(\d+)$/.exec(String(posicion || "").toUpperCase().trim());
  if (!match) return false;
  const [, letra, numero] = match;
  const fila = indiceDeLetra(letra);
  const columna = parseInt(numero, 10);
  return fila >= 0 && fila < filas && columna >= 1 && columna <= columnas;
};
