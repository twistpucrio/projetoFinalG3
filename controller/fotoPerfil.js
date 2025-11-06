 /* ../controller/fotoPerfil.js */
"use strict";

/* ========= Utils ========= */
const _getUsuarioAtual = () => {
  try { return JSON.parse(localStorage.getItem("usuarioAtual") || "null"); } catch { return null; }
};
const _setUsuarioAtual = (u) => localStorage.setItem("usuarioAtual", JSON.stringify(u));

document.addEventListener("DOMContentLoaded", () => {
  const perfilView   = document.getElementById("perfil-view");
  const formCadastro = document.getElementById("form-cadastro");
  const formEdicao   = document.getElementById("form-edicao");

  const avatarView = document.getElementById("avatar-view");
  const semFoto    = document.getElementById("sem-foto");
  const listaDados = document.getElementById("lista-dados");

  const btnEditar        = document.getElementById("btn-editar");
  const btnCancelarEd    = document.getElementById("btn-cancelar-edicao");
  const btnLogout        = document.getElementById("btn-logout");

  const avatarPreview = document.getElementById("avatar-preview");

  // Exposto globalmente para o cadastro.js chamar depois da edição
  window.renderPerfil = function renderPerfil(userArg) {
    const u = userArg || _getUsuarioAtual();

    // troca de telas
    if (u) {
      if (perfilView) perfilView.style.display = "block";
      if (formCadastro) formCadastro.style.display = "none";
      if (formEdicao) formEdicao.style.display = "none";
    } else {
      if (perfilView) perfilView.style.display = "none";
      if (formCadastro) formCadastro.style.display = "block";
      if (formEdicao) formEdicao.style.display = "none";
      return;
    }

    // foto
    if (u?.avatar && typeof u.avatar === "string") {
      if (avatarView) {
        avatarView.src = u.avatar;
        avatarView.style.display = "block";
      }
      if (semFoto) semFoto.style.display = "none";
    } else {
      if (avatarView) avatarView.style.display = "none";
      if (semFoto) semFoto.style.display = "block";
    }

    // dados
    if (listaDados) {
      listaDados.innerHTML = `
        <li><b>Nome:</b> ${u.nome || ""}</li>
        <li><b>CPF:</b> ${u.cpf || ""}</li>
        <li><b>E-mail:</b> ${u.email || ""}</li>
        <li><b>CEP:</b> ${u.cep || ""}</li>
        <li><b>Endereço:</b> ${u.end || ""}</li>
        <li><b>Complemento:</b> ${u.comp || ""}</li>
        <li><b>Profissão:</b> ${u.profissao || ""}</li>
        <li><b>Faculdade:</b> ${u.faculdade || ""}</li>
        <li><b>Skills:</b> ${u.skills || ""}</li>
        <li><b>Interesses:</b> ${u.interesses || ""}</li>
        <li><b>Trabalhos prévios:</b> ${u.trab || ""}</li>
      `;
    }

    // prévia da foto atual na EDIÇÃO (quando abrir)
    if (avatarPreview && u?.avatar) {
      avatarPreview.src = u.avatar;
      avatarPreview.style.display = "block";
    }

    // atualiza ícone do header, se função existir
    if (window.refreshHeaderAvatar) window.refreshHeaderAvatar();
  };

  // Editar -> abre form de edição preenchendo campos
  if (btnEditar) {
    btnEditar.addEventListener("click", () => {
      const u = _getUsuarioAtual();
      if (!u) return;

      const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };

      setVal("nome-editar", u.nome);
      setVal("cpf-editar", u.cpf);
      setVal("email-editar", u.email);
      setVal("cep-editar", u.cep);
      setVal("end-editar", u.end);
      setVal("comp-editar", u.comp);
      setVal("profissao-editar", u.profissao);
      setVal("faculdade-editar", u.faculdade);
      setVal("skills-editar", u.skills);
      setVal("interesses-editar", u.interesses);
      setVal("trab-editar", u.trab);

      if (avatarPreview && u.avatar) {
        avatarPreview.src = u.avatar;
        avatarPreview.style.display = "block";
      }

      if (perfilView) perfilView.style.display = "none";
      if (formEdicao) formEdicao.style.display = "block";
    });
  }

  if (btnCancelarEd) {
    btnCancelarEd.addEventListener("click", () => {
      if (formEdicao) formEdicao.style.display = "none";
      if (perfilView) perfilView.style.display = "block";
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioAtual");
      // volta para cadastro
      if (perfilView) perfilView.style.display = "none";
      if (formCadastro) formCadastro.style.display = "block";
      if (formEdicao) formEdicao.style.display = "none";
      // limpa avatar grande
      if (avatarView) avatarView.style.display = "none";
      if (semFoto) semFoto.style.display = "block";
      // header volta ao default
      if (window.refreshHeaderAvatar) window.refreshHeaderAvatar();
    });
  }

  // Render inicial
  window.renderPerfil();
});
