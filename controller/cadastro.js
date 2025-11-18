 /* ../controller/cadastro.js */
"use strict";

(() => {
  const $$ = (sel, root = document) => root.querySelector(sel);
  const show = (el) => { if (el) el.style.display = "block"; };
  const hide = (el) => { if (el) el.style.display = "none"; };

  const MAX_AVATAR_BYTES = 180 * 1024;

  const getUsuarios = () => JSON.parse(localStorage.getItem("usuarios") || "[]");
  const setUsuarios = (arr) => localStorage.setItem("usuarios", JSON.stringify(arr));
  const getUsuarioAtual = () => JSON.parse(localStorage.getItem("usuarioAtual") || "null");
  const setUsuarioAtual = (u) => localStorage.setItem("usuarioAtual", JSON.stringify(u));
  const clearUsuarioAtual = () => localStorage.removeItem("usuarioAtual");

  const isPerfil = /perfil\.html$/i.test(location.pathname);
  const url = new URL(location.href);
  const querCadastro = url.searchParams.get("cadastro") === "1";

  // ===== Helpers de imagem =====
  const lerArquivoComoDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  const carregarImagem = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const dataURLBytes = (dataURL) => {
    if (!dataURL) return 0;
    const base64 = dataURL.split(",")[1] || "";
    return Math.floor((base64.length * 3) / 4);
  };

  async function comprimirImagem(
    file,
    maxW = 512,
    maxH = 512,
    qualities = [0.8, 0.6, 0.5, 0.4],
    targetBytes = MAX_AVATAR_BYTES
  ) {
    const raw = await lerArquivoComoDataURL(file);
    const img = await carregarImagem(raw);

    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    let out = raw, last = raw;
    for (const q of qualities) {
      out = canvas.toDataURL("image/jpeg", q);
      last = out;
      if (dataURLBytes(out) <= targetBytes) break;
    }
    return last;
  }

  // ===== Header =====
  const usuario = getUsuarioAtual();
  const bemVindo = $$("#bem-vindo");
  if (usuario?.nome && bemVindo) {
    bemVindo.textContent = `Olá, ${usuario.nome.split(" ")[0]}!`;
  }
  const perfilImg = document.getElementById("perfil");
  if (perfilImg?.parentElement) {
    perfilImg.parentElement.setAttribute("href", usuario ? "perfil.html" : "login.html");
  }

  // ===== Telas do perfil =====
  const perfilView = $$("#perfil-view");
  const listaDados = $$("#lista-dados");
  const avatarView = $$("#avatar-view");
  const semFoto = $$("#sem-foto");

  const formCadastro = $$("#form-cadastro");
  const formEdicao = $$("#form-edicao");
  const inputAvatarCadastro = $$("#avatar");
  const inputAvatarEditar = $$("#avatar-editar");
  const avatarPreview = $$("#avatar-preview");

  const btnEditar = $$("#btn-editar");
  const btnLogout = $$("#btn-logout");
  const btnCancelarEdicao = $$("#btn-cancelar-edicao");

  // ===== Render Perfil =====
  function renderPerfil(u) {
    if (!perfilView) return;
    hide(formCadastro);
    hide(formEdicao);
    show(perfilView);

    if (u?.avatar) {
      avatarView.src = u.avatar;
      show(avatarView);
      hide(semFoto);
    } else {
      hide(avatarView);
      show(semFoto);
    }

    if (u.tipoUsuario === "PF") {
      listaDados.innerHTML = `
        <li><strong>Nome:</strong> ${u.nome}</li>
        <li><strong>Email:</strong> ${u.email}</li>
        <li><strong>Profissão:</strong> ${u.profissao}</li>
        <li><strong>Faculdade:</strong> ${u.faculdade}</li>
        <li><strong>Skills:</strong> ${u.skills}</li>
        <li><strong>Interesses:</strong> ${u.interesses}</li>
        <li><strong>Trabalhos prévios:</strong> ${u.trab}</li>
      `;
    } else {
      listaDados.innerHTML = `
        <li><strong>Razão Social:</strong> ${u.razaoSocial}</li>
        <li><strong>CNPJ:</strong> ${u.cnpj}</li>
        <li><strong>Email comercial:</strong> ${u.email}</li>
        <li><strong>Porte:</strong> ${u.porte}</li>
        <li><strong>Segmento:</strong> ${u.segmento}</li>
        <li><strong>Descrição:</strong> ${u.descricaoEmpresa}</li>
      `;
    }
  }

  // ===== Preencher formulário de edição =====
  function preencherFormEdicao(u) {
    if (!formEdicao) return;

    // Se for PF
    if (u.tipoUsuario === "PF") {
      $$("#editar-pf").style.display = "block";
      $$("#editar-pj").style.display = "none";

      document.getElementById("nome-editar").value = u.nome;
      document.getElementById("cpf-editar").value = u.cpf;
      document.getElementById("email-editar").value = u.email;
      document.getElementById("cep-editar").value = u.cep;
      document.getElementById("end-editar").value = u.end;
      document.getElementById("comp-editar").value = u.comp;
      document.getElementById("profissao-editar").value = u.profissao;
      document.getElementById("faculdade-editar").value = u.faculdade;
      document.getElementById("skills-editar").value = u.skills;
      document.getElementById("interesses-editar").value = u.interesses;
      document.getElementById("trab-editar").value = u.trab;
    }

    // Se for PJ
    if (u.tipoUsuario === "PJ") {
      $$("#editar-pf").style.display = "none";
      $$("#editar-pj").style.display = "block";

      document.getElementById("razaoSocial-editar").value = u.razaoSocial;
      document.getElementById("cnpj-editar").value = u.cnpj;
      document.getElementById("emailEmpresa-editar").value = u.email;
      document.getElementById("porte-editar").value = u.porte;
      document.getElementById("segmento-editar").value = u.segmento;
      document.getElementById("descricaoEmpresa-editar").value = u.descricaoEmpresa;
    }

    if (avatarPreview) {
      if (u.avatar) {
        avatarPreview.src = u.avatar;
        show(avatarPreview);
      } else {
        hide(avatarPreview);
      }
    }
  }

  // ===== Guarda de rota =====
  if (isPerfil) {
    if (!usuario && !querCadastro) {
      location.href = "login.html";
    } else if (usuario) {
      renderPerfil(usuario);
    } else if (querCadastro) {
      hide(perfilView);
      hide(formEdicao);
      show(formCadastro);
    }
  }

  // ===== Logout =====
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      clearUsuarioAtual();
      location.href = "index.html";
    });
  }

  // ===== Editar =====
  if (btnEditar) {
    btnEditar.addEventListener("click", () => {
      if (!getUsuarioAtual()) return;
      hide(perfilView);
      hide(formCadastro);
      show(formEdicao);
      preencherFormEdicao(getUsuarioAtual());
    });
  }

  // ===== Cancelar edição =====
  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => {
      renderPerfil(getUsuarioAtual());
    });
  }

  // ===== Salvar edição =====
  if (formEdicao) {
    formEdicao.addEventListener("submit", async (e) => {
      e.preventDefault();

      let u = getUsuarioAtual();
      if (!u) return;

      const file = inputAvatarEditar?.files?.[0];
      if (file instanceof File && file.size > 0) {
        u.avatar = await comprimirImagem(file);
      }

      const getVal = (id) => document.getElementById(id)?.value || "";

      if (u.tipoUsuario === "PF") {
        u.nome = getVal("nome-editar");
        u.cpf = getVal("cpf-editar");
        u.email = getVal("email-editar");
        u.cep = getVal("cep-editar");
        u.end = getVal("end-editar");
        u.comp = getVal("comp-editar");
        u.profissao = getVal("profissao-editar");
        u.faculdade = getVal("faculdade-editar");
        u.skills = getVal("skills-editar");
        u.interesses = getVal("interesses-editar");
        u.trab = getVal("trab-editar");
      } else {
        u.razaoSocial = getVal("razaoSocial-editar");
        u.cnpj = getVal("cnpj-editar");
        u.email = getVal("emailEmpresa-editar");
        u.porte = getVal("porte-editar");
        u.segmento = getVal("segmento-editar");
        u.descricaoEmpresa = getVal("descricaoEmpresa-editar");
      }

      setUsuarioAtual(u);

      const usuarios = getUsuarios();
      const idx = usuarios.findIndex((x) => x.email === u.email);
      if (idx !== -1) usuarios[idx] = u;
      setUsuarios(usuarios);

      renderPerfil(u);
    });
  }

  // ===== Cadastro PF/PJ =====
  if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(formCadastro);

        const tipo = fd.get("tipoUsuario");
        const fileAvatar = fd.get("avatar");

        if (!(fileAvatar instanceof File) || fileAvatar.size === 0) {
          alert("Selecione uma imagem válida!");
          return;
        }

        const senha = fd.get("senha");
        const confirmar = fd.get("confirmar-senha");

        if (senha !== confirmar) {
          alert("As senhas não coincidem!");
          return;
        }

        const usuarios = getUsuarios();

        const email = tipo === "PF" ? fd.get("email") : fd.get("emailEmpresa");

        if (usuarios.some((u) => u.email === email)) {
          alert("Este e-mail já está cadastrado!");
          return;
        }

        const avatarDataURL = await comprimirImagem(fileAvatar);

        let user = { tipoUsuario: tipo, avatar: avatarDataURL };

        if (tipo === "PF") {
          user = {
            ...user,
            nome: fd.get("nome"),
            cpf: fd.get("cpf"),
            email: fd.get("email"),
            cep: fd.get("cep"),
            end: fd.get("end"),
            comp: fd.get("comp"),
            profissao: fd.get("profissao"),
            faculdade: fd.get("faculdade"),
            skills: fd.get("skills"),
            interesses: fd.get("interesses"),
            trab: fd.get("trab"),
            senha: senha
          };
        } else {
          user = {
            ...user,
            razaoSocial: fd.get("razaoSocial"),
            cnpj: fd.get("cnpj"),
            email: fd.get("emailEmpresa"),
            porte: fd.get("porte"),
            segmento: fd.get("segmento"),
            descricaoEmpresa: fd.get("descricaoEmpresa"),
            senha: senha
          };
        }

        usuarios.push(user);
        setUsuarios(usuarios);
        setUsuarioAtual(user);

        location.href = "perfil.html";

      } catch (err) {
        console.error("Erro no cadastro PF/PJ:", err);
      }
    });
  }

  // ===== Login =====
  const formLogin = document.querySelector(".form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(formLogin);
      const { email, senha } = Object.fromEntries(fd.entries());

      const usuarios = getUsuarios();
      const u = usuarios.find((x) => x.email === email && x.senha === senha);

      if (u) {
        setUsuarioAtual(u);
        location.href = "perfil.html";
      } else {
        alert("Email ou senha incorretos!");
      }
    });
  }

})();
