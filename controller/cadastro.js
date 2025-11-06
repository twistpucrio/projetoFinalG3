 /* ../controller/cadastro.js */
"use strict";

/**
 * Tudo dentro de um IIFE para evitar variáveis globais e não colidir com postar.js.
 * Mantém o mesmo fluxo de telas (perfil/login/cadastro) e redirecionamentos que você já usa.
 */
(() => {
  // ===== Utils locais (sem poluir o global) =====
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

  // ===== Helpers de imagem (compacta para DataURL) =====
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

  // ===== Header / atalhos (mesmo comportamento do seu arquivo original) =====
  const usuario = getUsuarioAtual();
  const bemVindo = $$("#bem-vindo");
  if (usuario?.nome && bemVindo) {
    const primeiro = usuario.nome.split(" ")[0];
    bemVindo.textContent = `Olá, ${primeiro}!`;
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
  const inputAvatarCadastro = $$("#avatar");

  const formEdicao = $$("#form-edicao");
  const btnEditar = $$("#btn-editar");
  const btnLogout = $$("#btn-logout");
  const btnCancelarEdicao = $$("#btn-cancelar-edicao");
  const inputAvatarEditar = $$("#avatar-editar");
  const avatarPreview = $$("#avatar-preview");

  const HIDDEN_KEYS_IN_VIEW = new Set(["cpf", "cep", "end", "comp"]);

  function renderPerfil(u) {
    if (!perfilView) return;
    hide(formCadastro);
    hide(formEdicao);
    show(perfilView);

    if (u?.avatar) {
      if (avatarView) { avatarView.src = u.avatar; show(avatarView); }
      hide(semFoto);
    } else {
      if (avatarView) hide(avatarView);
      show(semFoto);
    }

    if (listaDados) {
      const labels = {
        nome: "Nome completo",
        email: "E-mail",
        profissao: "Profissão",
        faculdade: "Faculdade",
        skills: "Skills",
        interesses: "Interesses",
        trab: "Trabalhos prévios"
      };
      const ordem = ["nome","email","profissao","faculdade","skills","interesses","trab"];
      listaDados.innerHTML = ordem
        .filter((k) => !HIDDEN_KEYS_IN_VIEW.has(k))
        .filter((k) => u?.[k] !== undefined && u[k] !== "")
        .map((k) => `<li><strong>${labels[k]}:</strong> ${u[k]}</li>`)
        .join("");
    }
  }

  function preencherFormEdicao(u) {
    if (!formEdicao) return;
    const m = {
      "#nome-editar": u?.nome || "",
      "#cpf-editar": u?.cpf || "",
      "#email-editar": u?.email || "",
      "#cep-editar": u?.cep || "",
      "#end-editar": u?.end || "",
      "#comp-editar": u?.comp || "",
      "#profissao-editar": u?.profissao || "",
      "#faculdade-editar": u?.faculdade || "",
      "#skills-editar": u?.skills || "",
      "#interesses-editar": u?.interesses || "",
      "#trab-editar": u?.trab || ""
    };
    Object.entries(m).forEach(([sel, val]) => {
      const el = document.querySelector(sel);
      if (el) el.value = val;
    });

    if (avatarPreview) {
      if (u?.avatar) {
        avatarPreview.src = u.avatar;
        show(avatarPreview);
      } else {
        hide(avatarPreview);
      }
    }
  }

  // ===== Guarda de rota (mesmo fluxo que você já tinha) =====
  if (isPerfil) {
    if (!usuario && !querCadastro) {
      location.href = "login.html";
    } else if (usuario) {
      renderPerfil(usuario);
    } else if (querCadastro) {
      hide(perfilView); hide(formEdicao); show(formCadastro);
    }
  }

  // ===== Logout =====
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      clearUsuarioAtual();
      sessionStorage.removeItem("usuarioAtual");
      location.href = "index.html";
    });
  }

  // ===== Entrar em edição =====
  if (btnEditar) {
    btnEditar.addEventListener("click", () => {
      if (!getUsuarioAtual()) return;
      hide(perfilView); hide(formCadastro); show(formEdicao);
      preencherFormEdicao(getUsuarioAtual());
    });
  }

  // ===== Cancelar edição =====
  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => {
      const u = getUsuarioAtual();
      if (u) renderPerfil(u);
      else { hide(formEdicao); show(formCadastro); }
    });
  }

  // ===== Salvar edição (AGORA IMPLEMENTADO) =====
  if (formEdicao) {
    formEdicao.addEventListener("submit", async (e) => {
      e.preventDefault();

      let u = getUsuarioAtual() || {};
      if (!u) return;

      // campos de texto
      const getVal = (id) => (document.getElementById(id)?.value || "");
      u = {
        ...u,
        nome: getVal("nome-editar"),
        cpf: getVal("cpf-editar"),
        email: getVal("email-editar"),
        cep: getVal("cep-editar"),
        end: getVal("end-editar"),
        comp: getVal("comp-editar"),
        profissao: getVal("profissao-editar"),
        faculdade: getVal("faculdade-editar"),
        skills: getVal("skills-editar"),
        interesses: getVal("interesses-editar"),
        trab: getVal("trab-editar"),
      };

      // foto opcional
      const file = inputAvatarEditar?.files?.[0] || null;
      if (file instanceof File && file.size > 0) {
        u.avatar = await comprimirImagem(file);
      }

      // persiste no atual
      setUsuarioAtual(u);

      // persiste na lista (chave = email)
      const usuarios = getUsuarios();
      const idx = usuarios.findIndex((x) => x.email === u.email);
      if (idx !== -1) usuarios[idx] = u;
      setUsuarios(usuarios);

      // volta para a view
      renderPerfil(u);
    });
  }

  // ===== Cadastro (AGORA salvando avatar como DataURL) =====
  if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(formCadastro);
        const dados = Object.fromEntries(fd.entries());
        const fileAvatar = fd.get("avatar");

        if (!(fileAvatar instanceof File) || fileAvatar.size === 0) {
          alert("Selecione uma foto de perfil válida.");
          return;
        }

        const usuarios = getUsuarios();
        if (usuarios.some((u) => u.email === dados.email)) {
          alert("Usuário já existe!");
          return;
        }

        // transforma a foto em DataURL compactado
        const avatarDataURL = await comprimirImagem(fileAvatar);

        // monta o usuário final (substitui o File pelo DataURL)
        const user = {
          nome: dados.nome || "",
          cpf: dados.cpf || "",
          email: dados.email || "",
          cep: dados.cep || "",
          end: dados.end || "",
          comp: dados.comp || "",
          profissao: dados.profissao || "",
          faculdade: dados.faculdade || "",
          skills: dados.skills || "",
          interesses: dados.interesses || "",
          trab: dados.trab || "",
          senha: dados.senha || "",
          avatar: avatarDataURL,
        };

        usuarios.push(user);
        setUsuarios(usuarios);
        setUsuarioAtual(user);
        sessionStorage.setItem("usuarioAtual", JSON.stringify(user));

        location.href = "perfil.html";
      } catch (err) {
        console.error("Erro no cadastro:", err);
      }
    });
  }

  // ===== Login (inalterado no seu fluxo) =====
  const formLogin = document.querySelector(".form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(formLogin);
      const { email = "", senha = "" } = Object.fromEntries(fd.entries());

      const usuarios = getUsuarios();
      const u = usuarios.find((x) => x.email === email && x.senha === senha);
      if (u) {
        setUsuarioAtual(u);
        sessionStorage.setItem("usuarioAtual", JSON.stringify(u));
        location.href = "perfil.html";
      } else {
        alert("Email ou senha incorretos!");
      }
    });
  }
})();
