

// ======== PEGAR DADOS ========
const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
const usuarioAtual = JSON.parse(localStorage.getItem("usuarioAtual") || "null");

const userList = document.getElementById("user-list");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");

// ======== LISTA DE USUÁRIOS ========
function atualizarListaUsuarios() {
  if (!userList) return;

  const outrosUsuarios = usuarios.filter(u => u.email !== usuarioAtual?.email);

  userList.innerHTML = outrosUsuarios
    .map(u => {
      const avatarSrc = u.avatar || 'img/perfil-padrao.png';
      return `
        <div class="user-item" data-email="${u.email}">
          <img src="${avatarSrc}" class="user-avatar" alt="${u.nome}">
          <span class="user-name">${u.nome}</span>
        </div>
      `;
    })
    .join("");
}


atualizarListaUsuarios();


// ======== SISTEMA DE MENSAGENS ========
// Cada conversa é salva em localStorage com chave "chat_<email1>_<email2>"
function getChatKey(email1, email2) {
  const emails = [email1, email2].sort();
  return `chat_${emails[0]}_${emails[1]}`;
}

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

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


function enviarMensagem(comEmail, texto) {
  const key = getChatKey(usuarioAtual.email, comEmail);
  const msgs = JSON.parse(localStorage.getItem(key) || "[]");
  
  msgs.push({ 
    remetente: usuarioAtual.email, 
    nome: usuarioAtual.nome, 
    texto,
    data: Date.now() // salva timestamp
  });
  
  localStorage.setItem(key, JSON.stringify(msgs));
}


// ======== EVENTOS ========
let usuarioSelecionado = null;

userList.addEventListener("click", (e) => {
  const item = e.target.closest(".user-item");
  if (!item || item.dataset.email === usuarioAtual.email) return;

  usuarioSelecionado = item.dataset.email;
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

// Atualiza automaticamente quando outra aba envia mensagem
window.addEventListener("storage", (e) => {
  if (e.key.startsWith("chat_") && usuarioSelecionado && e.key.includes(usuarioSelecionado)) {
    carregarMensagens(usuarioSelecionado);
  }
});
