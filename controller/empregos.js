document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('job-list');
  const detalhe = document.getElementById('job-detail');

  // Carrega JSON de empregos
  fetch('../view/JSON/empregos.json')
    .then(res => {
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const empregos = data.empregos || [];
      renderizarLista(empregos);
    })
    .catch(err => {
      console.error('Erro ao carregar empregos:', err);
      lista.innerHTML = '<li id="txt-espera">Erro ao carregar vagas.</li>';
    });

  // Renderiza os cards
  function renderizarLista(empregos) {
    lista.innerHTML = '';

    if (!empregos || empregos.length === 0) {
      lista.innerHTML = '<li id="txt-espera">Nenhuma vaga disponível.</li>';
      return;
    }

    empregos.forEach((emprego) => {
      const li = document.createElement('li');
      li.className = 'job-card';
      li.innerHTML = `
        <h3>${emprego.titulo}</h3>
        <p class="empresa">${emprego.empresa}</p>
        <p class="local">${emprego.local}</p>
      `;

      li.addEventListener('click', () => {
        selecionarCard(li, emprego);
      });

      lista.appendChild(li);
    });
  }

  // Marca o card selecionado e mostra detalhes
  function selecionarCard(cardElement, emprego) {
    // Remove seleção anterior
    document.querySelectorAll('.job-card.selected').forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-selected', 'false');
    });

    // Marca o card atual
    cardElement.classList.add('selected');
    cardElement.setAttribute('aria-selected', 'true');

    // Atualiza painel de detalhes
    mostrarDetalhes(emprego);
  }

  // Atualiza conteúdo da seção de detalhe
  function mostrarDetalhes(emprego) {
    detalhe.innerHTML = `
      <div class="detail">
        <h1>${emprego.titulo}</h1>
        <p><strong>Empresa:</strong> ${emprego.empresa}</p>
        <p><strong>Local:</strong> ${emprego.local}</p>
        <p><strong>Salário:</strong> ${emprego.salario || 'Não informado'}</p>
        <hr style="margin: 1em 0; border: 0; border-top: 1px solid var(--border);">
        <p>${emprego.descricao || 'Descrição não disponível.'}</p>
      </div>
    `;
  }
});
