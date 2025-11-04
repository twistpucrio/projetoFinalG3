const express = require('express');
const cors = require('cors');
const productRoutes = require('./controller/posts.js');

const app = express();
const PORT = process.env.PORT || 8003;

// Configurações
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/posts', productRoutes);

// Tratamento de erros de execução [500]
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Tratamento de erros de execução [404]
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`API disponível em: http://localhost:${PORT}/api`);
});