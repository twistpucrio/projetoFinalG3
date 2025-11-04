document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('job-list');
  const detalhe = document.getElementById('job-detail');
  let empresas = []; // variável global para armazenar as empresas carregadas

  // Carrega JSON de empresas
  fetch('../view/JSON/empresas.json')
    .then(res => {
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);
      return res.json();
    })
    .then(data => {
      empresas = data.empregos || []; // mantém o mesmo nome da chave do JSON
      renderizarLista(empresas);

      // Se houver um ?id= na URL, seleciona automaticamente a empresa
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        const empresaSelecionada = empresas.find(e => e.id == id);
        if (empresaSelecionada) {
          const cards = document.querySelectorAll(".job-card");
          const card = Array.from(cards).find(c => c.querySelector("h3").textContent === empresaSelecionada.titulo);
          if (card) selecionarCard(card, empresaSelecionada);
        }
      }
    })
    .catch(err => {
      console.error('Erro ao carregar empresas:', err);
      lista.innerHTML = '<li id="txt-espera">Erro ao carregar empresas.</li>';
    });

  // Renderiza os cards da lista de empresas
  function renderizarLista(empresas) {
    lista.innerHTML = '';

    if (!empresas || empresas.length === 0) {
      lista.innerHTML = '<li id="txt-espera">Nenhuma empresa disponível.</li>';
      return;
    }

    empresas.forEach((empresa) => {
      const li = document.createElement('li');
      li.className = 'job-card';
      li.innerHTML = `
        <h3>${empresa.titulo}</h3>
        <p class="empresa">${empresa.empresa}</p>
        <p class="local">${empresa.local}</p>
      `;

      li.addEventListener('click', () => {
        selecionarCard(li, empresa);

        // Atualiza o parâmetro "id" na URL sem recarregar a página
        const url = new URL(window.location);
        url.searchParams.set("id", empresa.id);
        window.history.pushState({}, "", url);
      });

      lista.appendChild(li);
    });
  }

  // Marca o card selecionado e mostra detalhes
  function selecionarCard(cardElement, empresa) {
    // Remove seleção anterior
    document.querySelectorAll('.job-card.selected').forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-selected', 'false');
    });

    // Marca o card atual
    cardElement.classList.add('selected');
    cardElement.setAttribute('aria-selected', 'true');

    // Atualiza painel de detalhes
    mostrarDetalhes(empresa);
  }

  // Atualiza conteúdo da seção de detalhes
  function mostrarDetalhes(empresa) {
    detalhe.innerHTML = `
      <div class="detail">
        <h1>${empresa.titulo}</h1>
        <p><strong>Empresa:</strong> ${empresa.empresa}</p>
        <p><strong>Local:</strong> ${empresa.local}</p>
        <p><strong>Vagas:</strong> ${empresa.vagas || 'Não informado'}</p>
        <p>${empresa.descricao || 'Descrição não disponível.'}</p>  
      </div>
    `;
  }
});
