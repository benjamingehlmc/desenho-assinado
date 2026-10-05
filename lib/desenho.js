// Gera a tabuada modular no círculo como texto SVG.
// Função pura: sem DOM, sem rede. Fica FORA de public/ para nunca ser servida ao navegador.

const PONTOS = 240;
const LARGURA = 800;
const ALTURA = 860;
const CENTRO_X = 400;
const CENTRO_Y = 400;
const RAIO = 360;

export function numeroValido(numero) {
  return Number.isInteger(numero) && numero >= 1 && numero <= 100;
}

export function escaparXml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ponto(i) {
  const angulo = (2 * Math.PI * i) / PONTOS - Math.PI / 2;
  return [CENTRO_X + RAIO * Math.cos(angulo), CENTRO_Y + RAIO * Math.sin(angulo)];
}

export function gerarDesenho(numero, email) {
  if (!numeroValido(numero)) {
    throw new RangeError("numero deve ser um inteiro entre 1 e 100");
  }

  const k = numero + 1;
  const linhas = [];

  for (let i = 0; i < PONTOS; i++) {
    const j = (k * i) % PONTOS;
    const [x1, y1] = ponto(i);
    const [x2, y2] = ponto(j);
    const matiz = Math.round((i / PONTOS) * 360);
    linhas.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="hsl(${matiz},85%,60%)" stroke-width="0.6" stroke-opacity="0.75"/>`
    );
  }

  const assinatura = escaparXml(`assinado por ${email}`);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGURA} ${ALTURA}" width="${LARGURA}" height="${ALTURA}">`,
    `<rect width="${LARGURA}" height="${ALTURA}" fill="#0d1117"/>`,
    `<circle cx="${CENTRO_X}" cy="${CENTRO_Y}" r="${RAIO}" fill="none" stroke="#ffffff" stroke-opacity="0.08"/>`,
    `<g>`,
    ...linhas,
    `</g>`,
    `<text x="${CENTRO_X}" y="810" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#c9d1d9">n = ${numero}</text>`,
    `<text x="${CENTRO_X}" y="838" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#8b949e">${assinatura}</text>`,
    `</svg>`,
  ].join("\n");
}
