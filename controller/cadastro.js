 /* ../controller/cadastro.js */
"use strict";

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const show = (el) => el && (el.style.display = "block");
  const hide = (el) => el && (el.style.display = "none");

  const MAX = 180 * 1024;

  const getUsuarios = () =>
    JSON.parse(localStorage.getItem("usuarios") || "[]");

  const setUsuarios = (arr) =>
    localStorage.setItem("usuarios", JSON.stringify(arr));

  const getUsuarioAtual = () =>
    JSON.parse(localStorage.getItem("usuarioAtual") || "null");

  const setUsuarioAtual = (u) =>
    localStorage.setItem("usuarioAtual", JSON.stringify(u));

  const clearUsuarioAtual = () => localStorage.removeItem("usuarioAtual");

  const isPerfil = /perfil\.html$/i.test(location.pathname);
  const url = new URL(location.href);
  const querCadastro = url.searchParams.get("cadastro") === "1";

  /* ==== Utils de imagem (bem simples) ==== */
  const lerFile = (file) =>
    new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(file);
    });

  async function comprimir(file) {
    if (!file) return null;
    const base = await lerFile(file);
    return base; // sem compressão pesada por enquanto
  }

  /* ==== Elementos ==== */
  const perfilView = $("#perfil-view");
  const formCadastro = $("#form-cadastro");
  const formEdicao = $("#form-edicao");
  const listaDados = $("#lista-dados");
  const avatarView = $("#avatar-view");
  const logoView = $("#logo-empresa-view");
  const semFoto = $("#sem-foto");

  const tipoUserSelect = $("#tipo-user");
  const camposPF = $("#campos-pf");
  const camposEmpresa = $("#campos-empresa");

  if (tipoUserSelect) {
    tipoUserSelect.addEventListener("change", () => {
      if (tipoUserSelect.value === "empresa") {
        camposPF.style.display = "none";
        camposEmpresa.style.display = "block";
      } else {
        camposPF.style.display = "block";
        camposEmpresa.style.display = "none";
      }
    });
  }

  /* ==== Renderização do perfil (PF x EMPRESA) ==== */
  function renderPerfil(u) {
    if (!u) return;

    hide(formCadastro);
    hide(formEdicao);
    show(perfilView);

    // Heurística: detecta empresa mesmo que tipo esteja errado
    const isEmpresa =
      u.tipo === "empresa" ||
      !!u.nomeEmpresa ||
      !!u.cnpj ||
      !!u.logoEmpresa;

    const isPF = !isEmpresa;

    // zera imagens
    avatarView.style.display = "none";
    logoView.style.display = "none";
    semFoto.style.display = "none";

    if (isPF) {
      if (u.avatar) {
        avatarView.src = u.avatar;
        avatarView.style.display = "block";
      } else {
        semFoto.style.display = "block";
      }

      listaDados.innerHTML = `
        <li><strong>Nome:</strong> ${u.nome || ""}</li>
        <li><strong>E-mail:</strong> ${u.email || ""}</li>
        <li><strong>Profissão:</strong> ${u.profissao || ""}</li>
        <li><strong>Faculdade:</strong> ${u.faculdade || ""}</li>
        <li><strong>Skills:</strong> ${u.skills || ""}</li>
        <li><strong>Interesses:</strong> ${u.interesses || ""}</li>
        <li><strong>Trabalhos prévios:</strong> ${u.trab || ""}</li>
      `;
    } else {
      if (u.logoEmpresa) {
        logoView.src = u.logoEmpresa;
        logoView.style.display = "block";
      } else if (u.avatar) {
        // fallback, caso empresa tenha avatar
        avatarView.src = u.avatar;
        avatarView.style.display = "block";
      } else {
        semFoto.style.display = "block";
      }

      listaDados.innerHTML = `
        <li><strong>Empresa:</strong> ${u.nomeEmpresa || ""}</li>
        <li><strong>E-mail:</strong> ${u.email || ""}</li>
        <li><strong>CNPJ:</strong> ${u.cnpj || ""}</li>
        <li><strong>Área de atuação:</strong> ${u.areaAtuacao || ""}</li>
        <li><strong>Nº de funcionários:</strong> ${u.numFuncionarios || ""}</li>
        <li><strong>Endereço comercial:</strong> ${u.endComercial || ""}</li>
        <li><strong>Descrição:</strong> ${u.descricaoEmpresa || ""}</li>
      `;
    }
  }

  /* ==== Inicialização da página de perfil ==== */
  if (isPerfil) {
    const u = getUsuarioAtual();
    if (!u && !querCadastro) {
      location.href = "login.html";
    } else if (u) {
      renderPerfil(u);
    } else if (querCadastro) {
      hide(perfilView);
      show(formCadastro);
    }
  }

  /* ==== Logout ==== */
  const btnLogout = $("#btn-logout");
  if (btnLogout) {
    btnLogout.onclick = () => {
      clearUsuarioAtual();
      location.href = "index.html";
    };
  }

  /* ==== Cadastro (PF / Empresa) ==== */
  if (formCadastro) {
    formCadastro.onsubmit = async (ev) => {
      ev.preventDefault();

      const tipo = tipoUserSelect.value;
      const usuarios = getUsuarios();

      const email = $("#email").value.trim();
      const senha = $("#senha").value;

      let user = { tipo, email, senha };

      if (tipo === "pf") {
        user.nome = $("#nome").value.trim();
        user.cpf = $("#cpf").value.trim();
        user.cep = $("#cep").value.trim();
        user.end = $("#end").value.trim();
        user.comp = $("#comp").value.trim();
        user.profissao = $("#profissao").value.trim();
        user.faculdade = $("#faculdade").value.trim();
        user.skills = $("#skills").value.trim();
        user.interesses = $("#interesses").value.trim();
        user.trab = $("#trab").value.trim();

        const avatarFile = $("#avatar").files[0];
        user.avatar = avatarFile ? await comprimir(avatarFile) : null;

        user.exibicaoNome = user.nome;
        user.exibicaoFoto = user.avatar;
      }

      if (tipo === "empresa") {
        user.nomeEmpresa = $("#nomeEmpresa").value.trim();
        user.cnpj = $("#cnpj").value.trim();
        user.endComercial = $("#endComercial").value.trim();
        user.areaAtuacao = $("#areaAtuacao").value.trim();
        user.numFuncionarios = $("#numFuncionarios").value.trim();
        user.descricaoEmpresa = $("#descricaoEmpresa").value.trim();

        const logoFile = $("#logoEmpresa").files[0];
        user.logoEmpresa = logoFile ? await comprimir(logoFile) : null;

        user.exibicaoNome = user.nomeEmpresa;
        user.exibicaoFoto = user.logoEmpresa;
      }

      usuarios.push(user);
      setUsuarios(usuarios);
      setUsuarioAtual(user);

      location.href = "perfil.html";
    };
  }

  /* ==== (Opcional) edição de perfil pode ser completada depois ==== */
})();
