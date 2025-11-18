/* ../controller/fotoPerfil.js */
"use strict";

/* ==== Utils ==== */
const _getUsuarioAtual = () => {
  try { return JSON.parse(localStorage.getItem("usuarioAtual") || "null"); }
  catch { return null; }
};

window.refreshHeaderAvatar = function () {
  const headerAvatar = document.getElementById("perfil");
  const u = _getUsuarioAtual();
  if (!headerAvatar) return;

  if (u?.avatar) {
    headerAvatar.src = u.avatar;
  } else {
    headerAvatar.src = "img/perfil.png";
  }
};

/* ==== Render Perfil ==== */
document.addEventListener("DOMContentLoaded", () => {

  const perfilView = document.getElementById("perfil-view");
  const formCadastro = document.getElementById("form-cadastro");
  const formEdicao = document.getElementById("form-edicao");

  const avatarView = document.getElementById("avatar-view");
  const semFoto = document.getElementById("sem-foto");
  const listaDados = document.getElementById("lista-dados");

  const btnEditar = document.getElementById("btn-editar");
  const btnLogout = document.getElementById("btn-logout");
  const btnCancelarEd = document.getElementById("btn-cancelar-edicao");

  const avatarPreview = document.getElementById("avatar-preview");

  window.renderPerfil = function () {

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
    const usuarioAtual = _getUsuarioAtual();
    const emailAberto = localStorage.getItem("perfilAberto");

    let u = null;

    if (emailAberto) {
      u = usuarios.find(x => x.email === emailAberto);
    }

    if (!u) {
      u = usuarioAtual;
      localStorage.removeItem("perfilAberto");
    }

    perfilView.style.display = "block";
    formCadastro.style.display = "none";
    formEdicao.style.display = "none";

    if (u.avatar) {
      avatarView.src = u.avatar;
      avatarView.style.display = "block";
      semFoto.style.display = "none";
    } else {
      avatarView.style.display = "none";
      semFoto.style.display = "block";
    }

    listaDados.innerHTML = `
      <li><b>Nome:</b> ${u.nome}</li>
      <li><b>CPF:</b> ${u.cpf}</li>
      <li><b>E-mail:</b> ${u.email}</li>
      <li><b>CEP:</b> ${u.cep}</li>
      <li><b>Endereço:</b> ${u.end}</li>
      <li><b>Complemento:</b> ${u.comp}</li>
      <li><b>Profissão:</b> ${u.profissao}</li>
      <li><b>Faculdade:</b> ${u.faculdade}</li>
      <li><b>Skills:</b> ${u.skills}</li>
      <li><b>Interesses:</b> ${u.interesses}</li>
      <li><b>Trabalhos prévios:</b> ${u.trab}</li>
    `;

    const postToolbar = document.getElementById("post-toolbar");

    if (u.email === usuarioAtual.email) {
      btnEditar.style.display = "block";
      btnLogout.style.display = "block";
      postToolbar.style.display = "flex";
    } else {
      btnEditar.style.display = "none";
      btnLogout.style.display = "none";
      postToolbar.style.display = "none";
    }

    avatarPreview.style.display = u.avatar ? "block" : "none";
    if (u.avatar) avatarPreview.src = u.avatar;

    window.refreshHeaderAvatar();
  };

  btnEditar?.addEventListener("click", () => {
    const u = _getUsuarioAtual();

    const set = (id, val) => document.getElementById(id).value = val;

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

    formEdicao.style.display = "block";
    perfilView.style.display = "none";
  });

  btnCancelarEd?.addEventListener("click", () => {
    formEdicao.style.display = "none";
    perfilView.style.display = "block";
  });

  btnLogout?.addEventListener("click", () => {
    localStorage.removeItem("usuarioAtual");
    localStorage.removeItem("perfilAberto");
    location.reload();
  });

  window.renderPerfil();
});
