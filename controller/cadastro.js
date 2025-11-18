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
  const inputAvatarEditar = $$("#avatar-editar");
  const avatarPreview = $$("#avatar-preview");

  const btnEditar = $$("#btn-editar");
  const btnLogout = $$("#btn-logout");
  const btnCancelarEdicao = $$("#btn-cancelar-edicao");

  // ===== Render Perfil =====
  function renderPerfil(u) {
    if (!perfilView || !u) return;

    hide(formCadastro);
    hide(formEdicao);
    show(perfilView);

    if (u.avatar) {
      if (avatarView) {
        avatarView.src = u.avatar;
        show(avatarView);
      }
      if (semFoto) hide(semFoto);
    } else {
      if (avatarView) hide(avatarView);
      if (semFoto) show(semFoto);
    }

    if (!listaDados) return;

    const tipo = u.tipoUsuario === "PJ" ? "PJ" : "PF";

    if (tipo === "PF") {
      listaDados.innerHTML = `
        <li><strong>Nome:</strong> ${u.nome || ""}</li>
        <li><strong>Email:</strong> ${u.email || ""}</li>
        <li><strong>Profissão:</strong> ${u.profissao || ""}</li>
        <li><strong>Faculdade:</strong> ${u.faculdade || ""}</li>
        <li><strong>Skills:</strong> ${u.skills || ""}</li>
        <li><strong>Interesses:</strong> ${u.interesses || ""}</li>
        <li><strong>Trabalhos prévios:</strong> ${u.trab || ""}</li>
      `;
    } else {
      listaDados.innerHTML = `
        <li><strong>Razão Social:</strong> ${u.razaoSocial || ""}</li>
        <li><strong>CNPJ:</strong> ${u.cnpj || ""}</li>
        <li><strong>Email comercial:</strong> ${u.email || ""}</li>
        <li><strong>Porte:</strong> ${u.porte || ""}</li>
        <li><strong>Segmento:</strong> ${u.segmento || ""}</li>
        <li><strong>Descrição:</strong> ${u.descricaoEmpresa || ""}</li>
      `;
    }
  }

  // ===== Preencher formulário de edição =====
  function preencherFormEdicao(u) {
    if (!formEdicao || !u) return;

    const tipo = u.tipoUsuario === "PJ" ? "PJ" : "PF";

    const editarPF = $$("#editar-pf");
    const editarPJ = $$("#editar-pj");

    if (tipo === "PF") {
      if (editarPF) editarPF.style.display = "block";
      if (editarPJ) editarPJ.style.display = "none";

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
      };

      set("nome-editar", u.nome);
      set("cpf-editar", u.cpf);
      set("email-editar", u.email);
      set("cep-editar", u.cep);
      set("end-editar", u.end);
      set("comp-editar", u.comp);
      set("profissao-editar", u.profissao);
      set("faculdade-editar", u.faculdade);
      set("skills-editar", u.skills);
      set("interesses-editar", u.interesses);
      set("trab-editar", u.trab);
    } else {
      if (editarPF) editarPF.style.display = "none";
      if (editarPJ) editarPJ.style.display = "block";

      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || "";
      };

      set("razaoSocial-editar", u.razaoSocial);
      set("cnpj-editar", u.cnpj);
      set("emailEmpresa-editar", u.email);
      set("porte-editar", u.porte);
      set("segmento-editar", u.segmento);
      set("descricaoEmpresa-editar", u.descricaoEmpresa);
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
  if (querCadastro) {
    // se quiser, pode limpar o usuário logado ao criar nova conta:
    // clearUsuarioAtual();

    hide(perfilView);
    hide(formEdicao);
    show(formCadastro);
  } else if (!usuario) {
    // sem usuário e sem pedir cadastro -> vai pro login
    location.href = "login.html";
  } else {
    // perfil normal de quem está logado
    renderPerfil(usuario);
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
      const u = getUsuarioAtual();
      if (!u) return;
      hide(perfilView);
      hide(formCadastro);
      show(formEdicao);
      preencherFormEdicao(u);
    });
  }

  // ===== Cancelar edição =====
  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => {
      const u = getUsuarioAtual();
      if (u) renderPerfil(u);
    });
  }

  // ===== Salvar edição =====
  if (formEdicao) {
    formEdicao.addEventListener("submit", async (e) => {
      e.preventDefault();

      let u = getUsuarioAtual();
      if (!u) return;

      const tipo = u.tipoUsuario === "PJ" ? "PJ" : "PF";

      const file = inputAvatarEditar?.files?.[0];
      if (file instanceof File && file.size > 0) {
        u.avatar = await comprimirImagem(file);
      }

      const getVal = (id) => document.getElementById(id)?.value || "";

      if (tipo === "PF") {
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

        const tipo = fd.get("tipoUsuario") === "PJ" ? "PJ" : "PF";
        const fileAvatar = fd.get("avatar");

        if (!(fileAvatar instanceof File) || fileAvatar.size === 0) {
          alert("Selecione uma imagem válida!");
          return;
        }

        const senha = fd.get("senha") || "";
        const confirmar = fd.get("confirmar-senha") || "";

        if (senha !== confirmar) {
          alert("As senhas não coincidem!");
          return;
        }

        const usuarios = getUsuarios();

        const email =
          tipo === "PF"
            ? (fd.get("email") || "").trim()
            : (fd.get("emailEmpresa") || "").trim();

        if (!email) {
          alert("Informe um e-mail válido.");
          return;
        }

        if (usuarios.some((u) => u.email === email)) {
          alert("Este e-mail já está cadastrado!");
          return;
        }

        const avatarDataURL = await comprimirImagem(fileAvatar);

        let user = { tipoUsuario: tipo, avatar: avatarDataURL, email, senha };

        if (tipo === "PF") {
          user = {
            ...user,
            nome: (fd.get("nome") || "").trim(),
            cpf: (fd.get("cpf") || "").trim(),
            cep: (fd.get("cep") || "").trim(),
            end: (fd.get("end") || "").trim(),
            comp: (fd.get("comp") || "").trim(),
            profissao: (fd.get("profissao") || "").trim(),
            faculdade: (fd.get("faculdade") || "").trim(),
            skills: (fd.get("skills") || "").trim(),
            interesses: (fd.get("interesses") || "").trim(),
            trab: (fd.get("trab") || "").trim()
          };
        } else {
          user = {
            ...user,
            razaoSocial: (fd.get("razaoSocial") || "").trim(),
            cnpj: (fd.get("cnpj") || "").trim(),
            porte: (fd.get("porte") || "").trim(),
            segmento: (fd.get("segmento") || "").trim(),
            descricaoEmpresa: (fd.get("descricaoEmpresa") || "").trim()
          };
        }

        usuarios.push(user);
        setUsuarios(usuarios);
        setUsuarioAtual(user);

        location.href = "perfil.html";
      } catch (err) {
        console.error("Erro no cadastro PF/PJ:", err);
        alert("Ocorreu um erro ao cadastrar. Tente novamente.");
      }
    });
  }

  // ===== Login =====
  const formLogin = document.querySelector(".form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(formLogin);
      const { email = "", senha = "" } = Object.fromEntries(fd.entries());

      const usuarios = getUsuarios();
      let u = usuarios.find((x) => x.email === email && x.senha === senha);

      // compatibilidade com usuários antigos sem tipoUsuario
      if (u && !u.tipoUsuario) {
        u.tipoUsuario = "PF";
        setUsuarioAtual(u);
        const idx = usuarios.findIndex((x) => x.email === u.email);
        if (idx !== -1) {
          usuarios[idx] = u;
          setUsuarios(usuarios);
        }
      }

      if (u) {
        setUsuarioAtual(u);
        location.href = "perfil.html";
      } else {
        alert("Email ou senha incorretos!");
      }
    });
  }

})();
