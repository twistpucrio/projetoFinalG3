 /* controller/cadastro.js */
"use strict";

window.addEventListener("DOMContentLoaded", () => {
  // ========= Utils =========
  const $ = (sel, root = document) => root.querySelector(sel);
  const show = (el) => { if (el) el.style.display = "block"; };
  const hide = (el) => { if (el) el.style.display = "none"; };

  const MAX_AVATAR_MB = 2;
  const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;
  const regexCEP = /^\d{5}-\d{3}$/;

  const getUsuarios = () => JSON.parse(localStorage.getItem("usuarios") || "[]");
  const setUsuarios = (arr) => localStorage.setItem("usuarios", JSON.stringify(arr));
  const getUsuarioAtual = () => JSON.parse(localStorage.getItem("usuarioAtual") || "null");
  const setUsuarioAtual = (u) => localStorage.setItem("usuarioAtual", JSON.stringify(u));
  const clearUsuarioAtual = () => localStorage.removeItem("usuarioAtual");

  const isPerfil = /perfil\.html$/i.test(location.pathname);
  const url = new URL(location.href);
  const querCadastro = url.searchParams.get("cadastro") === "1";

  const lerArquivoComoDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  // ========= Header / atalhos =========
  const usuario = getUsuarioAtual();

  const bemVindo = $("#bem-vindo");
  if (usuario?.nome && bemVindo) {
    const primeiro = usuario.nome.split(" ")[0];
    bemVindo.textContent = `Olá, ${primeiro}!`;
  }

  const perfilImg = $("#perfil");
  if (perfilImg?.parentElement) {
    perfilImg.parentElement.setAttribute("href", usuario ? "perfil.html" : "login.html");
  }

  // ========= Telas do perfil =========
  const perfilView   = $("#perfil-view");
  const listaDados   = $("#lista-dados");
  const avatarView   = $("#avatar-view");
  const semFoto      = $("#sem-foto");

  const formCadastro = $("#form-cadastro");
  const inputAvatarCadastro = $("#avatar");

  const formEdicao   = $("#form-edicao");
  const btnEditar    = $("#btn-editar");
  const btnLogout    = $("#btn-logout");
  const btnCancelarEdicao = $("#btn-cancelar-edicao");
  const inputAvatarEditar  = $("#avatar-editar");
  const avatarPreview      = $("#avatar-preview");

  // >>>> CAMPOS ESCONDIDOS NA VISUALIZAÇÃO DO PERFIL <<<<
  // (continuam salvos e aparecem na EDIÇÃO)
  const HIDDEN_KEYS_IN_VIEW = new Set(["cpf", "cep", "end", "comp"]);

  function renderPerfil(u) {
    if (!perfilView) return;

    // Decide o que mostrar
    hide(formCadastro);
    hide(formEdicao);
    show(perfilView);

    // Foto
    if (u?.avatar) {
      if (avatarView) {
        avatarView.src = u.avatar;
        show(avatarView);
      }
      hide(semFoto);
    } else {
      if (avatarView) hide(avatarView);
      show(semFoto);
    }

    // Dados (ocultando cpf, cep, end, comp)
    if (listaDados) {
      const labels = {
        nome: "Nome completo",
        // cpf: "CPF",                 // oculto
        email: "E-mail",
        // cep: "CEP",                 // oculto
        // end: "Endereço",            // oculto
        // comp: "Complemento",        // oculto
        profissao: "Profissão",
        faculdade: "Faculdade",
        skills: "Skills",
        interesses: "Interesses",
        trab: "Trabalhos prévios"
      };

      const ordem = [
        "nome","email",
        // "cep","end","comp","cpf",   // removidos da visualização
        "profissao","faculdade","skills","interesses","trab"
      ];

      listaDados.innerHTML = ordem
        .filter((k) => !HIDDEN_KEYS_IN_VIEW.has(k)) // redundante, mas explícito
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
      const el = $(sel);
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

  // ========= Guarda de rota do perfil =========
  if (isPerfil) {
    if (!usuario && !querCadastro) {
      location.href = "login.html";
      return;
    }

    if (usuario) {
      renderPerfil(usuario);
    } else {
      // sem login -> só mostra cadastro se ?cadastro=1
      if (querCadastro) {
        hide(perfilView);
        hide(formEdicao);
        show(formCadastro);
      } else {
        hide(perfilView);
        hide(formEdicao);
        hide(formCadastro); // fallback
      }
    }
  }

  // ========= Logout =========
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      clearUsuarioAtual();
      location.href = "index.html";
    });
  }

  // ========= Entrar na Edição =========
  if (btnEditar) {
    btnEditar.addEventListener("click", () => {
      if (!getUsuarioAtual()) return; // segurança
      hide(perfilView);
      hide(formCadastro);
      show(formEdicao);
      preencherFormEdicao(getUsuarioAtual());
    });
  }

  // ========= Cancelar Edição =========
  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => {
      const u = getUsuarioAtual();
      if (u) renderPerfil(u);
      else {
        hide(formEdicao);
        show(formCadastro);
      }
    });
  }

  // ========= Salvar Edição =========
  if (formEdicao) {
    formEdicao.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const uAtual = getUsuarioAtual();
        if (!uAtual) return alert("Sessão expirada. Faça login novamente.");

        const usuarios = getUsuarios();
        const novo = {
          nome: $("#nome-editar")?.value?.trim() || "",
          cpf: $("#cpf-editar")?.value?.trim() || "",
          email: $("#email-editar")?.value?.trim() || "",
          cep: $("#cep-editar")?.value?.trim() || "",
          end: $("#end-editar")?.value?.trim() || "",
          comp: $("#comp-editar")?.value?.trim() || "",
          profissao: $("#profissao-editar")?.value?.trim() || "",
          faculdade: $("#faculdade-editar")?.value?.trim() || "",
          skills: $("#skills-editar")?.value?.trim() || "",
          interesses: $("#interesses-editar")?.value?.trim() || "",
          trab: $("#trab-editar")?.value?.trim() || "",
          avatar: uAtual.avatar || null // mantém a atual por padrão
        };

        if (!novo.nome || !novo.email) {
          alert("Nome e e-mail são obrigatórios.");
          return;
        }
        if (!regexCEP.test(novo.cep)) {
          alert("CEP inválido! Use o formato *****-***.");
          return;
        }

        // E-mail alterado não pode colidir com outro usuário
        const emailAlterado = novo.email !== uAtual.email;
        if (emailAlterado && usuarios.some((u) => u.email === novo.email)) {
          alert("Já existe um usuário com esse e-mail.");
          return;
        }

        // Troca de avatar (opcional)
        const fileNovo = inputAvatarEditar?.files?.[0];
        if (fileNovo) {
          if (!fileNovo.type.startsWith("image/")) {
            alert("O arquivo de foto precisa ser uma imagem.");
            return;
          }
          if (fileNovo.size > MAX_AVATAR_BYTES) {
            alert(`A imagem é muito grande. Tamanho máximo: ${MAX_AVATAR_MB} MB.`);
            return;
          }
          try {
            novo.avatar = await lerArquivoComoDataURL(fileNovo);
          } catch {
            alert("Não foi possível ler a nova imagem. Tente novamente.");
            return;
          }
        }

        // Atualiza em `usuarios`
        let usuariosIdx = usuarios.findIndex((u) => u.email === uAtual.email);
        if (usuariosIdx === -1) usuariosIdx = usuarios.findIndex((u) => u.cpf === uAtual.cpf);
        if (usuariosIdx !== -1) {
          usuarios[usuariosIdx] = { ...usuarios[usuariosIdx], ...novo };
        } else {
          usuarios.push(novo); // fallback raro
          usuariosIdx = usuarios.length - 1;
        }

        setUsuarios(usuarios);
        setUsuarioAtual(usuarios[usuariosIdx]);

        renderPerfil(usuarios[usuariosIdx]);
        alert("Perfil atualizado com sucesso!");
      } catch (err) {
        console.error("Erro ao salvar edição:", err);
        alert("Ocorreu um erro ao salvar. Tente novamente.");
      }
    });
  }

  // ========= Cadastro =========
  if (formCadastro) {
    formCadastro.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(formCadastro);
        const dados = Object.fromEntries(fd.entries());
        const fileAvatar = fd.get("avatar");

        // Validações
        if (dados.senha !== dados["confirmar-senha"]) {
          alert("As senhas não coincidem. Tente novamente.");
          $("#confirmar-senha")?.focus();
          return;
        }
        if (!regexCEP.test(dados.cep)) {
          alert("CEP inválido! Use o formato *****-***.");
          $("#cep")?.focus();
          return;
        }
        if (!fileAvatar || !(fileAvatar instanceof File)) {
          alert("Selecione uma foto de perfil.");
          $("#avatar")?.focus();
          return;
        }
        if (!fileAvatar.type.startsWith("image/")) {
          alert("O arquivo de foto precisa ser uma imagem.");
          return;
        }
        if (fileAvatar.size > MAX_AVATAR_BYTES) {
          alert(`A imagem é muito grande. Tamanho máximo: ${MAX_AVATAR_MB} MB.`);
          return;
        }

        const dataUrl = await lerArquivoComoDataURL(fileAvatar);
        dados.avatar = dataUrl;

        delete dados["confirmar-senha"]; // não persistimos confirmação

        const usuarios = getUsuarios();
        if (usuarios.some((u) => u.email === dados.email)) {
          alert("Usuário já existe!");
          return;
        }

        usuarios.push(dados);
        setUsuarios(usuarios);
        setUsuarioAtual(dados);

        location.href = "perfil.html";
      } catch (err) {
        console.error("Erro no cadastro:", err);
        alert("Ocorreu um erro ao cadastrar. Tente novamente.");
      }
    });
  }

  // ========= Login (em login.html) =========
  const formLogin = $(".form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(formLogin);
      const { email = "", senha = "" } = Object.fromEntries(fd.entries());

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

  // ========= Fallback visual =========
  if (isPerfil) {
    const algumVisivel =
      (perfilView && getComputedStyle(perfilView).display !== "none") ||
      (formCadastro && getComputedStyle(formCadastro).display !== "none") ||
      (formEdicao && getComputedStyle(formEdicao).display !== "none");

    if (!algumVisivel) {
      if (usuario) renderPerfil(usuario);
      else if (querCadastro) { hide(perfilView); hide(formEdicao); show(formCadastro); }
      else { location.href = "login.html"; }
    }
  }
});
