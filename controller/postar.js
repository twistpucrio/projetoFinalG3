 /* controller/postar.js */
"use strict";

/* ========= Utils ========= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);
const show = (el) => el && (el.style.display = "block");
const hide = (el) => el && (el.style.display = "none");

const getUsuarioAtual = () => {
  try { return JSON.parse(localStorage.getItem("usuarioAtual") || "null"); }
  catch { return null; }
};

const getPosts = () => {
  try { return JSON.parse(localStorage.getItem("posts") || "[]"); }
  catch { return []; }
};

const setPosts = (arr) => localStorage.setItem("posts", JSON.stringify(arr));


/* ========= Comentários ========= */
function renderComentariosHTML(lista) {
  if (!lista || !lista.length)
    return `<p class="sem-comentarios">Nenhum comentário ainda</p>`;

  return lista
    .map(
      (c) => `
      <div class="comentario">
        <strong>${c.autorNome || "Usuário"}:</strong>
        <span>${c.texto}</span>
      </div>
    `
    )
    .join("");
}


/* ========= RENDER FEED (GERAL OU PERFIL) ========= */
/* isPerfil = true → remove likes e comentários */
function renderFeed(feed, filterEmail = null, isPerfil = false) {
  const userAtual = getUsuarioAtual();
  let posts = getPosts();

  if (filterEmail) posts = posts.filter((p) => p.autorEmail === filterEmail);

  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = `<div class="post"><p class="legenda_post">Nenhum post ainda.</p></div>`;
    return;
  }

  for (const p of posts) {
    const liked = p.likedBy?.includes(userAtual?.email);

    const postEl = document.createElement("article");
    postEl.className = "user-post";
    postEl.dataset.id = p.id;

    /* 🔥 SE FOR PERFIL, remove botões de ação */
    const secoesAcoes = isPerfil
      ? ""
      : `
      <div class="post-acoes">
        <button class="btn-like ${liked ? "liked" : ""}">
          ❤️ <span class="like-count">${p.likes || 0}</span>
        </button>
        <button class="btn-toggle-comments">
          💬 Comentários (${p.comentarios?.length || 0})
        </button>
      </div>

      <section class="comentarios" style="display:none;">
        <div class="comentarios-list">
          ${renderComentariosHTML(p.comentarios || [])}
        </div>

        <div class="novo-comentario">
          <input type="text" class="input-comentario" placeholder="Escreva um comentário...">
          <button class="btn-comentar">Enviar</button>
        </div>
      </section>
    `;

    postEl.innerHTML = `
      <header class="user-post__header">
        <img class="user-post__avatar" src="${p.autorAvatar || ""}" alt="avatar">
        <div class="user-post__meta">
          <h2 class="user-post__name">${p.autorNome || "Usuário"}</h2>
          <small class="user-post__date">${new Date(p.criadoEm).toLocaleString()}</small>
        </div>
      </header>

      <p class="user-post__caption">${(p.texto || "").replace(/\n/g, "<br>")}</p>

      ${
        p.imagem
          ? `<img class="user-post__image" src="${p.imagem}" alt="imagem do post">`
          : ""
      }

      ${secoesAcoes}
    `;

    feed.appendChild(postEl);
  }

  /* Só ativa eventos se NÃO for perfil */
  if (!isPerfil) attachEvents(feed);
}


/* ========= Eventos (Curtir + Comentários) ========= */
function attachEvents(root) {
  const posts = getPosts();

  root.querySelectorAll(".user-post").forEach((postEl) => {
    const id = postEl.dataset.id;
    const post = posts.find((p) => p.id == id);

    if (!post) return;

    const btnLike = postEl.querySelector(".btn-like");
    const commentBtn = postEl.querySelector(".btn-toggle-comments");
    const commentSection = postEl.querySelector(".comentarios");
    const commentInput = postEl.querySelector(".input-comentario");
    const commentSend = postEl.querySelector(".btn-comentar");

    /* Curtir */
    if (btnLike) {
      btnLike.onclick = () => {
        const user = getUsuarioAtual();
        if (!user) return;

        if (!post.likedBy) post.likedBy = [];

        if (post.likedBy.includes(user.email)) {
          post.likedBy = post.likedBy.filter((e) => e !== user.email);
          post.likes--;
        } else {
          post.likedBy.push(user.email);
          post.likes++;
        }

        setPosts(posts);

        renderFeed($("#feed-posts")); // feed geral
        const fp = $("#feed-posts-perfil");
        if (fp && user) renderFeed(fp, user.email, true);
      };
    }

    /* Mostrar comentários */
    if (commentBtn) {
      commentBtn.onclick = () => {
        commentSection.style.display =
          commentSection.style.display === "none" ? "block" : "none";
      };
    }

    /* Enviar comentário */
    if (commentSend) {
      commentSend.onclick = () => {
        const texto = commentInput.value.trim();
        if (!texto) return;

        const user = getUsuarioAtual();
        if (!post.comentarios) post.comentarios = [];

        post.comentarios.push({
          autorEmail: user.email,
          autorNome: user.nome,
          texto,
        });

        commentInput.value = "";
        setPosts(posts);

        renderFeed($("#feed-posts"));
        const fp = $("#feed-posts-perfil");
        if (fp && user) renderFeed(fp, user.email, true);
      };
    }
  });
}


/* ========= Criar Novo Post ========= */
function setupNovoPost() {
  const user = getUsuarioAtual();
  if (!user) return;

  const btn = $("#btn-novo-post");
  const form = $("#form-novo-post");

  if (btn) btn.onclick = () => show(form);

  if (!form) return;

  form.onsubmit = async (ev) => {
    ev.preventDefault();

    const texto = $("#texto-post").value.trim();
    const arq = $("#imagem-post").files[0];

    let base64 = "";
    if (arq) {
      base64 = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(arq);
      });
    }

    const posts = getPosts();

    posts.unshift({
      id: Date.now(),
      texto,
      imagem: base64 || null,
      autorEmail: user.email,
      autorNome: user.nome,
      autorAvatar: user.avatar,
      criadoEm: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comentarios: [],
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


/* ========= Init ========= */
function init() {
  setupNovoPost();

  const feedGeral = $("#feed-posts");
  if (feedGeral) renderFeed(feedGeral);

  const user = getUsuarioAtual();
  const feedPerfil = $("#feed-posts-perfil");
  if (feedPerfil && user) renderFeed(feedPerfil, user.email, true);
}

document.addEventListener("DOMContentLoaded", init);
