// ======== PEGAR DADOS ========
const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
const usuarioAtual = JSON.parse(localStorage.getItem("usuarioAtual") || "null");

const userList = document.getElementById("user-list");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");

function atualizarListaUsuarios() {
  if (!userList) return;

  const outrosUsuarios = usuarios.filter(u => u.email !== usuarioAtual?.email);

  userList.innerHTML = outrosUsuarios.map(u => `
    <div class="user-item" data-email="${u.email}">
      <img src="${u.avatar || 'img/perfil-padrao.png'}" class="user-avatar">
      <span class="user-name">${u.nome}</span>
    </div>
  `).join("");
}
atualizarListaUsuarios();

function getChatKey(a, b) {
  return `chat_${[a, b].sort().join("_")}`;
}

function carregarMensagens(email) {
  const key = getChatKey(usuarioAtual.email, email);
  const msgs = JSON.parse(localStorage.getItem(key) || "[]");

  messagesDiv.innerHTML = msgs.map(m => `
      <div class="message ${m.remetente === usuarioAtual.email ? "sent" : "received"}">
        <img src="${(usuarios.find(u => u.email === m.remetente)?.avatar) || 'img/perfil-padrao.png'}" class="avatar">
        <div class="message-content">
          <p>${m.texto}</p>
        </div>
      </div>`).join("");

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function enviarMensagem(email, texto) {
  const key = getChatKey(usuarioAtual.email, email);
  const msgs = JSON.parse(localStorage.getItem(key) || "[]");

  msgs.push({
    remetente: usuarioAtual.email,
    texto,
    data: Date.now()
  });

  localStorage.setItem(key, JSON.stringify(msgs));
}

let usuarioSelecionado = null;

userList.addEventListener("click", e => {
  const item = e.target.closest(".user-item");
  if (!item) return;

  usuarioSelecionado = item.dataset.email;

  localStorage.setItem("perfilAberto", usuarioSelecionado);
  window.location.href = "perfil.html";
});

sendBtn.addEventListener("click", () => {
  const texto = input.value.trim();
  if (!texto || !usuarioSelecionado) return;

  enviarMensagem(usuarioSelecionado, texto);
  input.value = "";
  carregarMensagens(usuarioSelecionado);
});
