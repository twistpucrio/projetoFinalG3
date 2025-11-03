const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const CONNECTIONS_FILE = path.join(__dirname, 'data', 'connections.json');
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

// Seguir usuário
app.post('/follow', (req, res) => {
  const { followerId, followingId } = req.body;
  const connections = JSON.parse(fs.readFileSync(CONNECTIONS_FILE));

  let conn = connections.find(c => c.userId === followerId);
  if (!conn) {
    conn = { userId: followerId, following: [] };
    connections.push(conn);
  }
  if (!conn.following.includes(followingId)) conn.following.push(followingId);

  fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2));
  res.send({ success: true });
});

// Enviar mensagem
app.post('/send-message', (req, res) => {
  const { senderId, receiverId, text } = req.body;
  const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));

  const newMessage = {
    conversationId: [senderId, receiverId].sort().join('-'),
    senderId,
    receiverId,
    text,
    timestamp: new Date().toISOString()
  };

  messages.push(newMessage);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  res.send({ success: true, message: newMessage });
});

// Listar mensagens
app.get('/messages/:user1/:user2', (req, res) => {
  const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
  const conversationId = [req.params.user1, req.params.user2].sort().join('-');
  const convMessages = messages.filter(m => m.conversationId === conversationId);
  res.send(convMessages);
});

// Listar usuários
app.get('/users', (req, res) => {
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  res.send(users);
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
