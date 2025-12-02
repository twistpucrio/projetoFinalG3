// ======== PEGAR DADOS ========
const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
const usuarioAtual = JSON.parse(localStorage.getItem("usuarioAtual") || "null");

const userList = document.getElementById("user-list");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");

setElementVisibility(document.getElementById('chat-window'), false);

// ======== FUNÇÃO DA CHAVE DO CHAT ========
function getChatKey(email1, email2) {
  const emails = [email1, email2].sort();
  return `chat_${emails[0]}_${emails[1]}`;
}

// ======== NOTIFICAÇÕES – CONTAGEM DE NÃO LIDAS ========
function contarNaoLidas(email1, email2) {
  const key = getChatKey(email1, email2);
  const msgs = JSON.parse(localStorage.getItem(key) || "[]");

  return msgs.filter(msg =>
    msg.remetente === email2 && msg.lida !== true
  ).length;
}

function marcarComoLidas(email1, email2) {
  const key = getChatKey(email1, email2);
  const msgs = JSON.parse(localStorage.getItem(key) || "[]");

  msgs.forEach(m => {
    if (m.remetente === email2) m.lida = true;
  });

  localStorage.setItem(key, JSON.stringify(msgs));
}

// ======== LISTA DE USUÁRIOS + BADGES ========
function atualizarListaUsuarios() {
  if (!userList) return;

  const outrosUsuarios = usuarios.filter(u => u.email !== usuarioAtual?.email);

  userList.innerHTML = outrosUsuarios
    .map(u => {
      const avatarSrc = u.avatar || 'img/perfil-padrao.png';

      const naoLidas = contarNaoLidas(usuarioAtual.email, u.email);
      const badge = naoLidas > 0 ? `<span class="badge">${naoLidas}</span>` : "";

      return `
        <div class="user-item" data-email="${u.email}">
          <img src="${avatarSrc}" class="user-avatar">
          <span class="user-name">${u.nome}</span>
          ${badge}
        </div>
      `;
    })
    .join("");
}

atualizarListaUsuarios();

// ======== CARREGAR MENSAGENS ========
function carregarMensagens(comEmail) {
  const key = getChatKey(usuarioAtual.email, comEmail);
  const msgs = JSON.parse(localStorage.getItem(key) || "[]");

  messagesDiv.innerHTML = msgs.map(m => {
    const ehRemetenteAtual = m.remetente === usuarioAtual.email;
    const usuarioMsg = ehRemetenteAtual ? usuarioAtual : usuarios.find(u => u.email === m.remetente);
    const avatarSrc = usuarioMsg?.avatar || 'img/perfil-padrao.png';

    const hora = new Date(m.data || Date.now());
    const horaFormatada = hora.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    return `
      <div class="message ${ehRemetenteAtual ? 'sent' : 'received'}">
        <img src="${avatarSrc}" class="avatar">
        <div class="message-content">
          <p>${m.texto}</p>
          <span class="timestamp">${horaFormatada}</span>
        </div>
      </div>
    `;
  }).join("");

  // Ao abrir a conversa → zera notificações
  marcarComoLidas(usuarioAtual.email, comEmail);
  atualizarListaUsuarios();

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// ======== ENVIAR MENSAGEM ========
function enviarMensagem(comEmail, texto) {
  const key = getChatKey(usuarioAtual.email, comEmail);
  const msgs = JSON.parse(localStorage.getItem(key) || "[]");
  
  msgs.push({ 
    remetente: usuarioAtual.email, 
    nome: usuarioAtual.nome, 
    texto,
    data: Date.now(),
    lida: false
  });
  
  localStorage.setItem(key, JSON.stringify(msgs));
}


// ======== EVENTOS ========
let usuarioSelecionado = null;

userList.addEventListener("click", (e) => {
  const item = e.target.closest(".user-item");
  if (!item || item.dataset.email === usuarioAtual.email) {
    document.getElementById('chat-window').classList.remove("display-none");
    return
  };

  usuarioSelecionado = item.dataset.email;

  // Passa a mostrar a janela do chat se houver um usuário selecionado
  setElementVisibility(document.getElementById('chat-window'), true);

  document.getElementById("chat-header").textContent = `Chat com ${item.textContent}`;

  carregarMensagens(usuarioSelecionado);
});

sendBtn.addEventListener("click", () => {
  if (!usuarioSelecionado) return alert("Selecione alguém para conversar!");
  const texto = input.value.trim();
  if (!texto) return;

  enviarMensagem(usuarioSelecionado, texto);
  input.value = "";
  carregarMensagens(usuarioSelecionado);
});

// Atualiza quando outra aba envia mensagem
window.addEventListener("storage", () => {
  atualizarListaUsuarios();

  if (usuarioSelecionado) carregarMensagens(usuarioSelecionado);
});

// Enviar mensagem ao apertar ENTER
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // impede quebra de linha
    sendBtn.click();    // dispara o mesmo evento do botão
  }
});

/** 
 * Ajusta a visibilidada de um elemento adicionando ou removendo a classe que seta o atributo 'display' para 'None'
 * @param {HTMLElement} elemento elemento que vamos alterar a visibilidade. Se for nulo nada é feito 
 * @param {boolean} deveSerVisivel Boleano que indica se o elemento deve ser visível (removeremos a classe) ou não (adicionamos a classe)
 */
function setElementVisibility(elemento, deveSerVisivel) {
  const visibilityClass = "display-none";
  if (!elemento || !elemento.classList) {
    return;
  }

  if (deveSerVisivel) {
    elemento.classList.remove(visibilityClass);
  } else if (!elemento.classList.contains(visibilityClass)) {
    // Evita adicionar a classe em duplicidade
    elemento.classList.add(visibilityClass);
  }
}