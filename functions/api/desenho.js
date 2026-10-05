import { gerarDesenho, numeroValido } from "../../lib/desenho.js";
import { emailDoToken, extrairBearer } from "../../lib/token.js";

function resposta(status, texto, extra = {}) {
  return new Response(texto, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });
}

export async function onRequest({ request, env }) {
  // 1) método -> 405
  if (request.method !== "POST") {
    return resposta(405, "Método não permitido. Use POST.", { Allow: "POST" });
  }

  // 2) corpo -> 400
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return resposta(400, "Corpo ausente ou JSON inválido.");
  }
  if (corpo === null || typeof corpo !== "object" || !("numero" in corpo)) {
    return resposta(400, "Campo numero ausente.");
  }
  if (!numeroValido(corpo.numero)) {
    return resposta(400, "numero deve ser um inteiro entre 1 e 100.");
  }

  // 3) token -> 401
  const token = extrairBearer(request.headers.get("Authorization"));
  const email = await emailDoToken(token, env.GOOGLE_CLIENT_ID);
  if (!email) {
    return resposta(401, "Token ausente, inválido, expirado ou com e-mail não verificado.");
  }

  // 200: o e-mail vem do token verificado, nunca do corpo da requisição
  return new Response(gerarDesenho(corpo.numero, email), {
    status: 200,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "no-store" },
  });
}
