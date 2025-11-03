// messages.js
const userId = localStorage.getItem('userId'); // usuário logado
let activeChatUser = null;

// 🔹 Carrega lista de usuários
async function loadUsers() {
  const response = await fetch('/users');
  const users = await response.json();

  const userListDiv = document.getElementById('user-list');
  userListDiv.innerHTML = '';

  users.forEach(user => {
    if (user.id === userId) return; // não mostrar ele mesmo
    const div = document.createElement('div');
    div.classList.add('conversation');
    div.textContent = user.name;
    div.addEventListener('click', () => openChat(user));
    userListDiv.appendChild(div);
  });
}

// 🔹 Abre conversa com o usuário selecionado
async function openChat(user) {
  activeChatUser = user;
  document.getElementById('chat-header').textContent = `Chat com ${user.name}`;
  loadMessages(user.id);
}

// 🔹 Carrega mensagens entre o usuário logado e o selecionado
async function loadMessages(receiverId) {
  if (!receiverId) return;
  const response = await fetch(`/messages/${userId}/${receiverId}`);
  const messages = await response.json();

  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML = '';

  messages.forEach(msg => {
    const div = document.createElement('div');
    div.classList.add('message', msg.senderId === userId ? 'sent' : 'received');
    div.textContent = msg.text;
    messagesDiv.appendChild(div);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 🔹 Enviar mensagem
document.getElementById('send-button').addEventListener('click', async () => {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text || !activeChatUser) return;

  const response = await fetch('/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: userId,
      receiverId: activeChatUser.id,
      text
    })
  });

  const data = await response.json();
  if (data.success) {
    input.value = '';
    loadMessages(activeChatUser.id);
  }
});

// Inicializa
loadUsers();
