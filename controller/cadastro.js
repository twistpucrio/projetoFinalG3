 /* ../controller/cadastro.js */
"use strict";

/**
 * Tudo dentro de um IIFE para não vazar variáveis globais e não quebrar postar.js.
 * Só exportamos no window o que realmente precisa: refreshHeaderAvatar.
 */
(() => {
  /* ========= Utils locais (NÃO globais) ========= */
  const $$ = (sel, root = document) => root.querySelector(sel);
  const MAX_AVATAR_BYTES = 180 * 1024; // ~180KB

  const getUsuarios = () => {
    try { return JSON.parse(localStorage.getItem("usuarios") || "[]"); } catch { return []; }
  };
  const setUsuarios = (arr) => localStorage.setItem("usuarios", JSON.stringify(arr));

  const getUsuarioAtual = () => {
    try { return JSON.parse(localStorage.getItem("usuarioAtual") || "null"); } catch { return null; }
  };
  const setUsuarioAtual = (u) => localStorage.setItem("usuarioAtual", JSON.stringify(u));

  const lerArquivoComoDataURL = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  // Redimensiona e tenta comprimir para próximo do targetBytes
  async function comprimirImagem(file, maxW = 512, maxH = 512, qualidades = [0.8, 0.6, 0.5], targetBytes = MAX_AVATAR_BYTES) {
    const dataURL = await lerArquivoComoDataURL(file);
    const img = new Image();
    img.src = dataURL;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const nw = Math.round(img.width * ratio);
    const nh = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, nw, nh);

    for (const q of qualidades) {
      const out = canvas.toDataURL("image/jpeg", q);
      const bytes = Math.ceil((out.length * 3) / 4);
      if (bytes <= targetBytes) return out;
    }
    return canvas.toDataURL("image/jpeg", qualidades[qualidades.length - 1]);
  }

  /* ========= Atualização do avatar no header (exportado) ========= */
  function refreshHeaderAvatar() {
    const icone = document.getElementById("perfil"); // <img id="perfil" class="icon"...> no topbar
    if (!icone) return;
    const u = getUsuarioAtual();
    if (u && typeof u.avatar === "string" && u.avatar.startsWith("data:image/")) {
      icone.src = u.avatar;
    } else {
      icone.src = "img/perfil.png"; // fallback
    }
  }
  // Exporta APENAS isso
  window.refreshHeaderAvatar = refreshHeaderAvatar;

  /* ========= Cadastro ========= */
  document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = $$("#form-cadastro");
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

          const avatarDataURL = await comprimirImagem(
            fileAvatar,
            512, 512,
            [0.8, 0.6, 0.5],
            MAX_AVATAR_BYTES
          );

          const usuarios = getUsuarios();
          if (usuarios.some((u) => u.email === dados.email)) {
            alert("Usuário já existe com este e-mail.");
            return;
          }

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

          // Se estamos na página de perfil, apenas deixa a navegação natural;
          // se a sua navegação depende, pode manter o redirect:
          try { if (!location.pathname.endsWith("perfil.html")) location.href = "perfil.html"; } catch {}
        } catch (err) {
          console.error("Erro no cadastro:", err);
          alert("Não foi possível concluir o cadastro.");
        }
      });
    }

    /* ========= Edição ========= */
    const formEdicao = $$("#form-edicao");
    const inputAvatarEditar = $$("#avatar-editar");
    const avatarPreview = $$("#avatar-preview");

    if (inputAvatarEditar) {
      inputAvatarEditar.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewDataURL = await lerArquivoComoDataURL(file);
        if (avatarPreview) {
          avatarPreview.src = previewDataURL;
          avatarPreview.style.display = "block";
        }
      });
    }

    if (formEdicao) {
      formEdicao.addEventListener("submit", async (e) => {
        e.preventDefault();
        const u = getUsuarioAtual() || {};
        if (!u) return;

        // campos texto
        const getVal = (id) => (document.getElementById(id)?.value || "");
        u.nome       = getVal("nome-editar");
        u.cpf        = getVal("cpf-editar");
        u.email      = getVal("email-editar");
        u.cep        = getVal("cep-editar");
        u.end        = getVal("end-editar");
        u.comp       = getVal("comp-editar");
        u.profissao  = getVal("profissao-editar");
        u.faculdade  = getVal("faculdade-editar");
        u.skills     = getVal("skills-editar");
        u.interesses = getVal("interesses-editar");
        u.trab       = getVal("trab-editar");

        // foto opcional
        const file = inputAvatarEditar?.files?.[0] || null;
        if (file instanceof File && file.size > 0) {
          u.avatar = await comprimirImagem(file, 512, 512, [0.8, 0.6, 0.5], MAX_AVATAR_BYTES);
        }

        // persiste atual
        setUsuarioAtual(u);

        // persiste na lista
        const usuarios = getUsuarios();
        const idx = usuarios.findIndex((x) => x.email === u.email);
        if (idx !== -1) {
          usuarios[idx] = u;
          setUsuarios(usuarios);
        }

        // Atualiza ícone header e devolve para a view
        refreshHeaderAvatar();

        const perfilView = $$("#perfil-view");
        if (perfilView && formEdicao) {
          formEdicao.style.display = "none";
          perfilView.style.display = "block";
        }

        if (window.renderPerfil) window.renderPerfil(u);
      });
    }

    // Ajusta o avatar do header em qualquer página que carregar esse script
    refreshHeaderAvatar();
  });
})();
