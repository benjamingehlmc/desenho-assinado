import { gerarDesenho } from "../../lib/desenho.js";

function resposta(texto, status, extra = {}) {
  return new Response(texto, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...extra },
  });
}

export async function onRequest({ request, env }) {
  // 1) Método -> 405
  if (request.method !== "POST") {
    return resposta("Método não permitido", 405, { Allow: "POST" });
  }

  // 2) Corpo -> 400
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta("JSON inválido ou ausente", 400);
  }
  const numero = corpo && corpo.numero;
  if (typeof numero !== "number" || !Number.isInteger(numero) || numero < 1 || numero > 100) {
    return resposta("numero deve ser um inteiro entre 1 e 100", 400);
  }

  // 3) Token -> 401
  const auth = request.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m || !env.GOOGLE_CLIENT_ID) {
    return resposta("Token ausente", 401);
  }

  let info;
  try {
    const r = await fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(m[1])
    );
    if (r.status !== 200) return resposta("Token inválido", 401);
    info = await r.json();
  } catch {
    return resposta("Falha ao validar token", 401);
  }

  if (
    info.aud !== env.GOOGLE_CLIENT_ID ||
    String(info.email_verified) !== "true" ||
    !info.email
  ) {
    return resposta("Token não aceito", 401);
  }

  // 200: o e-mail da assinatura vem do token, nunca do cliente
  const svg = gerarDesenho(numero, info.email);
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
