// ================== CARREGAR DADOS ==================
const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
const usuarioAtual = JSON.parse(localStorage.getItem("usuarioAtual") || "null");

// Elementos que podem existir ou não dependendo da página
const userList = document.getElementById("user-list");
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-button");
const badgeGlobal = document.getElementById("unread-badge");


// ================== FUNÇÃO CHAVE DO CHAT ==================
function getChatKey(email1, email2) {
    const emails = [email1, email2].sort();
    return `chat_${emails[0]}_${emails[1]}`;
}


// ================== CONTAR NÃO LIDAS ENTRE DUAS PESSOAS ==================
function contarNaoLidas(email1, email2) {
    const key = getChatKey(email1, email2);
    const msgs = JSON.parse(localStorage.getItem(key) || "[]");

    return msgs.filter(msg =>
        msg.remetente === email2 && msg.lida !== true
    ).length;
}


// ================== CONTAR TODAS AS NÃO LIDAS (BADGE GLOBAL) ==================
function contarTotalNaoLidas() {
    if (!usuarioAtual) return 0;

    let total = 0;

    usuarios.forEach(u => {
        if (u.email !== usuarioAtual.email) {
            total += contarNaoLidas(usuarioAtual.email, u.email);
        }
    });

    return total;
}


// ================== ATUALIZAR BADGE GLOBAL ==================
function atualizarBadgeGlobal() {
    if (!badgeGlobal) return; // ← permite rodar em qualquer página

    const total = contarTotalNaoLidas();

    if (total <= 0) {
        badgeGlobal.style.display = "none";
    } else {
        badgeGlobal.style.display = "block";
        badgeGlobal.textContent = total > 99 ? "99+" : total;
    }
}

atualizarBadgeGlobal();


// ================== MARCAR COMO LIDAS ==================
function marcarComoLidas(email1, email2) {
    const key = getChatKey(email1, email2);
    const msgs = JSON.parse(localStorage.getItem(key) || "[]");

    msgs.forEach(m => {
        if (m.remetente === email2) m.lida = true;
    });

    localStorage.setItem(key, JSON.stringify(msgs));
}


// ================== LISTA DE USUÁRIOS (APENAS SE EXISTIR) ==================
function atualizarListaUsuarios() {
    if (!userList) {
        atualizarBadgeGlobal();
        return;
    }

    const outrosUsuarios = usuarios.filter(u => u.email !== usuarioAtual?.email);

    userList.innerHTML = outrosUsuarios
        .map(u => {
            const avatarSrc = u.avatar || 'img/perfil-padrao.png';
            const naoLidas = contarNaoLidas(usuarioAtual.email, u.email);

            const badge = naoLidas > 0
                ? `<span class="badge">${naoLidas}</span>`
                : "";

            return `
                <div class="user-item" data-email="${u.email}">
                    <img src="${avatarSrc}" class="user-avatar">
                    <span class="user-name">${u.nome}</span>
                    ${badge}
                </div>
            `;
        })
        .join("");

    atualizarBadgeGlobal();
}

atualizarListaUsuarios();


// ================== CARREGAR MENSAGENS ==================
function carregarMensagens(comEmail) {
    if (!messagesDiv) return; // ← se não estiver na página de mensagens, ignora

    const key = getChatKey(usuarioAtual.email, comEmail);
    const msgs = JSON.parse(localStorage.getItem(key) || "[]");

    messagesDiv.innerHTML = msgs.map(m => {
        const ehRemetenteAtual = m.remetente === usuarioAtual.email;
        const usuarioMsg = ehRemetenteAtual
            ? usuarioAtual
            : usuarios.find(u => u.email === m.remetente);

        const avatarSrc = usuarioMsg?.avatar || 'img/perfil-padrao.png';
        const hora = new Date(m.data || Date.now());
        const formatada = hora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="message ${ehRemetenteAtual ? 'sent' : 'received'}">
                <img src="${avatarSrc}" class="avatar">
                <div class="message-content">
                    <p>${m.texto}</p>
                    <span class="timestamp">${formatada}</span>
                </div>
            </div>
        `;
    }).join("");

    // Ao abrir o chat → marcar como lidas
    marcarComoLidas(usuarioAtual.email, comEmail);

    atualizarListaUsuarios();
    atualizarBadgeGlobal();
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// ================== ENVIAR MENSAGEM ==================
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

    atualizarBadgeGlobal();
}


// ================== EVENTOS (APENAS SE ELEMENTOS EXISTIREM) ==================
let usuarioSelecionado = null;

if (userList) {
    userList.addEventListener("click", (e) => {
        const item = e.target.closest(".user-item");
        if (!item || item.dataset.email === usuarioAtual.email) return;

        usuarioSelecionado = item.dataset.email;
        document.getElementById("chat-header").textContent =
            `Chat com ${item.textContent}`;

        carregarMensagens(usuarioSelecionado);
    });
}

if (sendBtn && input) {
    sendBtn.addEventListener("click", () => {
        if (!usuarioSelecionado) return alert("Selecione alguém para conversar!");
        const texto = input.value.trim();
        if (!texto) return;

        enviarMensagem(usuarioSelecionado, texto);
        input.value = "";
        carregarMensagens(usuarioSelecionado);
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendBtn.click();
        }
    });
}


// ================== ATUALIZAÇÃO EM TEMPO REAL ENTRE ABAS ==================
window.addEventListener("storage", () => {
    atualizarListaUsuarios();
    atualizarBadgeGlobal();

    if (usuarioSelecionado) {
        carregarMensagens(usuarioSelecionado);
    }
});
