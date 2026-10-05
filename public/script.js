const CLIENT_ID = "146157083486-87fduvsacqm9uf1daiadjqs0c4dfri3t.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const botaoEnviar = document.getElementById("enviar");
const botaoBaixar = document.getElementById("baixar");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const statusLogin = document.getElementById("status-login");

let idToken = null;
let svgAtual = "";

function aviso(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = tipo || "";
}

// Apenas para exibir na tela. A assinatura do desenho vem do servidor.
function emailDoToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)).email || "";
  } catch {
    return "";
  }
}

function aoLogar(resposta) {
  idToken = resposta.credential; // id_token (JWT) emitido pelo Google
  const email = emailDoToken(idToken);
  statusLogin.textContent = email ? "Conectado como " + email : "Login realizado com sucesso.";
  aviso("");
}

function iniciarGoogle(tentativa) {
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({ client_id: CLIENT_ID, callback: aoLogar });
    google.accounts.id.renderButton(document.getElementById("botao-google"), {
      theme: "filled_black",
      size: "large",
      shape: "pill",
      locale: "pt-BR",
    });
    return;
  }
  if (tentativa < 50) {
    setTimeout(() => iniciarGoogle(tentativa + 1), 200);
  } else {
    aviso("Não foi possível carregar o login do Google. Recarregue a página.", "erro");
  }
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  aviso("");
  area.innerHTML = "";
  botaoBaixar.hidden = true;
  svgAtual = "";

  const numero = Number(campoNumero.value);

  const cabecalhos = { "Content-Type": "application/json" };
  if (idToken) cabecalhos["Authorization"] = "Bearer " + idToken;

  botaoEnviar.disabled = true;
  botaoEnviar.textContent = "Gerando...";

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      aviso("Erro 400: digite um inteiro entre 1 e 100.", "erro");
      return;
    }
    if (resposta.status === 401) {
      idToken = null;
      statusLogin.textContent = "";
      aviso("Erro 401: faça login com o Google (ou entre de novo, se o login expirou).", "erro");
      return;
    }
    if (!resposta.ok) {
      aviso("Erro " + resposta.status + " ao gerar o desenho.", "erro");
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
    aviso("Desenho gerado!", "ok");
  } catch (erro) {
    aviso("Falha de rede ao chamar o servidor.", "erro");
  } finally {
    botaoEnviar.disabled = false;
    botaoEnviar.textContent = "Desenhar";
  }
});

botaoBaixar.addEventListener("click", () => {
  if (!svgAtual) return;
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

statusLogin.textContent = "Passo 1: clique no botão acima para entrar.";
iniciarGoogle(0);
