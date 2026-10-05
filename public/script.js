// Cole aqui o seu Client ID (ele é público e pode ficar no repositório).
const GOOGLE_CLIENT_ID = "COLE_SEU_CLIENT_ID.apps.googleusercontent.com";

let idToken = null;
let urlAtual = null;

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const statusLogin = document.getElementById("status-login");
const mensagem = document.getElementById("mensagem");
const resultado = document.getElementById("resultado");
const imagem = document.getElementById("imagem");
const baixar = document.getElementById("baixar");
const botao = formulario.querySelector("button");

function mostrarErro(texto) {
  mensagem.textContent = texto;
  mensagem.hidden = false;
  resultado.hidden = true;
}

function limparErro() {
  mensagem.hidden = true;
  mensagem.textContent = "";
}

function aoReceberCredencial(resp) {
  idToken = resp.credential;
  statusLogin.textContent = "Login com Google concluído.";
  limparErro();
}

function iniciarGoogle() {
  if (!window.google || !google.accounts) {
    setTimeout(iniciarGoogle, 100);
    return;
  }
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: aoReceberCredencial });
  google.accounts.id.renderButton(document.getElementById("botao-google"), {
    theme: "filled_blue", size: "large", text: "signin_with", locale: "pt-BR",
  });
}
iniciarGoogle();

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limparErro();

  const texto = campoNumero.value.trim();
  const numero = texto === "" ? undefined : Number(texto);

  botao.disabled = true;
  try {
    const headers = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = "Bearer " + idToken;

    const resp = await fetch("/api/desenho", {
      method: "POST",
      headers,
      body: JSON.stringify({ numero }),
    });

    if (resp.status === 200) {
      const svg = await resp.text();
      if (urlAtual) URL.revokeObjectURL(urlAtual);
      urlAtual = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      imagem.src = urlAtual;
      baixar.href = urlAtual;
      resultado.hidden = false;
    } else if (resp.status === 400) {
      mostrarErro("Número inválido: informe um inteiro entre 1 e 100.");
    } else if (resp.status === 401) {
      idToken = null;
      statusLogin.textContent = "Você ainda não entrou.";
      mostrarErro("Não autorizado: entre com a sua conta Google (a sessão pode ter expirado).");
    } else {
      mostrarErro("Erro inesperado (" + resp.status + "). Tente novamente.");
    }
  } catch (e) {
    mostrarErro("Falha de rede ao chamar o servidor.");
  } finally {
    botao.disabled = false;
  }
});
