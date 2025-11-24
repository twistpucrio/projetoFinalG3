 /* controller/postar.js */
"use strict";

/* Utils */
const $ = (sel, root = document) => root.querySelector(sel);
const hide = (el) => el && (el.style.display = "none");
const show = (el) => el && (el.style.display = "block");

const getUsuarioAtual = () =>
  JSON.parse(localStorage.getItem("usuarioAtual") || "null");

const getPosts = () =>
  JSON.parse(localStorage.getItem("posts") || "[]");

const setPosts = (arr) =>
  localStorage.setItem("posts", JSON.stringify(arr));

function renderComentariosHTML(lista) {
  if (!lista || !lista.length)
    return `<p class="sem-comentarios">Nenhum comentário ainda</p>`;
  return lista
    .map(
      (c) => `
    <div class="comentario">
      <strong>${c.autorNome}:</strong> ${c.texto}
    </div>`
    )
    .join("");
}

/* ---- render feed ---- */
function renderFeed(feed, filterEmail = null, isPerfil = false) {
  const user = getUsuarioAtual();
  let posts = getPosts();

  if (filterEmail) {
    posts = posts.filter((p) => p.autorEmail === filterEmail);
  }

  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = `<p>Nenhum post ainda.</p>`;
    return;
  }

  posts.forEach((p) => {
    const liked = p.likedBy?.includes(user?.email);

    const card = document.createElement("article");
    card.className = "user-post";
    card.dataset.id = p.id;

    /* esconder ações no perfil */
    const acoes = isPerfil
      ? ""
      : `
        <div class="post-acoes">
            <button class="btn-like ${liked ? "liked" : ""}">
              ❤️ <span class="like-count">${p.likes}</span>
            </button>
            <button class="btn-toggle-comments">
              💬 Comentários (${p.comentarios.length})
            </button>
        </div>

        <section class="comentarios" style="display:none;">
          <div class="comentarios-list">
            ${renderComentariosHTML(p.comentarios)}
          </div>
          <div class="novo-comentario">
            <input type="text" class="input-comentario" placeholder="Comente...">
            <button class="btn-comentar">Enviar</button>
          </div>
        </section>
      `;

    card.innerHTML = `
      <header class="user-post__header">
        <img class="user-post__avatar" src="${p.autorAvatar}" />
        <div>
          <h2>${p.autorNome}</h2>
          <small>${new Date(p.criadoEm).toLocaleString()}</small>
        </div>
      </header>

      <p>${(p.texto || "").replace(/\n/g, "<br>")}</p>

      ${
        p.imagem
          ? `<img class="user-post__image" src="${p.imagem}" />`
          : ""
      }

      ${acoes}
    `;

    feed.appendChild(card);
  });

  if (!isPerfil) attachEvents(feed);
}

/* ---- ações (curtir/comentar) ---- */
function attachEvents(root) {
  const user = getUsuarioAtual();
  let posts = getPosts();

  root.querySelectorAll(".user-post").forEach((el) => {
    const id = el.dataset.id;
    const post = posts.find((p) => p.id == id);

    if (!post) return;

    const btnLike = el.querySelector(".btn-like");
    const btnToggle = el.querySelector(".btn-toggle-comments");
    const section = el.querySelector(".comentarios");
    const send = el.querySelector(".btn-comentar");
    const input = el.querySelector(".input-comentario");

    if (btnLike) {
      btnLike.onclick = () => {
        if (!post.likedBy) post.likedBy = [];

        if (post.likedBy.includes(user.email)) {
          post.likedBy = post.likedBy.filter((e) => e !== user.email);
          post.likes--;
        } else {
          post.likedBy.push(user.email);
          post.likes++;
        }

        setPosts(posts);
        renderFeed($("#feed-posts"));
      };
    }

    if (btnToggle) {
      btnToggle.onclick = () => {
        section.style.display =
          section.style.display === "none" ? "block" : "none";
      };
    }

    if (send) {
      send.onclick = () => {
        const txt = input.value.trim();
        if (!txt) return;

        if (!post.comentarios) post.comentarios = [];

        post.comentarios.push({
          autorNome: user.exibicaoNome,
          autorEmail: user.email,
          texto: txt
        });

        input.value = "";
        setPosts(posts);
        renderFeed($("#feed-posts"));
      };
    }
  });
}

/* ---- criar novo post ---- */
function setupNovoPost() {
  const btn = $("#btn-novo-post");
  const form = $("#form-novo-post");

  if (btn) btn.onclick = () => show(form);

  if (form) {
    form.onsubmit = async (ev) => {
      ev.preventDefault();

      const user = getUsuarioAtual();
      let txt = $("#texto-post").value.trim();
      let file = $("#imagem-post").files[0];

      let base64 = "";
      if (file) base64 = await new Promise((res) => {
        let r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(file);
      });

      let posts = getPosts();

      posts.unshift({
        id: Date.now(),
        texto: txt,
        imagem: base64,
        autorNome: user.exibicaoNome,
        autorAvatar: user.exibicaoFoto,
        autorEmail: user.email,
        criadoEm: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        comentarios: []
      });

      setPosts(posts);

      $("#texto-post").value = "";
      $("#imagem-post").value = "";

      hide(form);

      renderFeed($("#feed-posts"));

      const fp = $("#feed-posts-perfil");
      if (fp) renderFeed(fp, user.email, true);
    };
  }
}

/* ---- init ---- */
function init() {
  setupNovoPost();

  const feed = $("#feed-posts");
  if (feed) renderFeed(feed);

  const user = getUsuarioAtual();
  const perfilFeed = $("#feed-posts-perfil");
  if (perfilFeed && user) {
    renderFeed(perfilFeed, user.email, true);
  }
}

document.addEventListener("DOMContentLoaded", init);
