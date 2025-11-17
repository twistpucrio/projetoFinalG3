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

/* ========= Helpers ========= */
function getPostsPath() {
  if (location.pathname.includes("/view/")) return "posts.html";
  return "view/posts.html";
}

/* ========= Criar novo post ========= */
function criarNovoPost({ texto, imagemDataURL }) {
  const user = getUsuarioAtual();
  if (!user) {
    alert("Faça login/cadastre-se para postar.");
    return null;
  }

  const posts = getPosts();

  const novoPost = {
    id: Date.now(),
    texto: texto.trim(),
    imagem: imagemDataURL || "",
    autorNome: user.nome || "Usuária",
    autorAvatar: user.avatar || "",
    autorEmail: user.email || "",
    criadoEm: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    comentarios: []
  };

  // adiciona no início
  posts.unshift(novoPost);
  setPosts(posts);
  return posts;
}

/* ========= Setup de novo post (toolbar do perfil) ========= */
function setupNovoPost() {
  const toolbar = $("#post-toolbar");
  const form = $("#form-novo-post");
  const btnNovoPost = $("#btn-novo-post");
  const textarea = $("#texto-post");
  const inputImagem = $("#imagem-post");

  const user = getUsuarioAtual();

  // se não tiver toolbar ou form nessa página, sai
  if (!toolbar || !form) return;

  if (user) {
    show(toolbar);
  } else {
    hide(toolbar);
    hide(form);
    return;
  }

  if (btnNovoPost) {
    btnNovoPost.onclick = () => {
      if (getComputedStyle(form).display === "none") {
        show(form);
      } else {
        hide(form);
      }
    };
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const texto = (textarea?.value || "").trim();
      if (!texto) {
        alert("Escreva alguma coisa para postar.");
        return;
      }

      const file = inputImagem?.files?.[0] || null;

      const depoisDeCriar = (postsAtualizados) => {
        if (!postsAtualizados) return;
        // limpa formulário
        if (textarea) textarea.value = "";
        if (inputImagem) inputImagem.value = "";
        hide(form);
        // re-renderiza feed se existir na página
        const feedEl = $("#feed-posts");
        if (feedEl) renderFeed(feedEl);
      };

      // se não tiver imagem, cria direto
      if (!file) {
        const postsAtualizados = criarNovoPost({ texto, imagemDataURL: "" });
        depoisDeCriar(postsAtualizados);
        return;
      }

      // se tiver imagem, ler como dataURL
      const reader = new FileReader();
      reader.onload = () => {
        const dataURL = reader.result;
        const postsAtualizados = criarNovoPost({ texto, imagemDataURL: dataURL });
        depoisDeCriar(postsAtualizados);
      };
      reader.onerror = () => {
        alert("Erro ao ler a imagem. Tente novamente.");
      };
      reader.readAsDataURL(file);
    });
  }
}

/* ========= Init ========= */
function init() {
  console.log("[postar.js] iniciado");

  // configura toolbar/form de novo post (perfil.html)
  setupNovoPost();

  // renderiza feed dinâmico (posts.html e também se tiver feed no perfil)
  const feed = $("#feed-posts");
  if (feed) renderFeed(feed);
}

/* ========= Render Feed ========= */
function renderFeed(feed) {
  const posts = getPosts();
  feed.innerHTML = "";

  if (!posts.length) {
    feed.innerHTML = `<div class="post"><p class="legenda_post">Ainda não há posts.</p></div>`;
    return;
  }

  for (const p of posts) {
    const liked = p.likedBy?.includes(getUsuarioAtual()?.email);
    const postEl = document.createElement("article");
    postEl.className = "user-post";
    postEl.dataset.id = p.id;

    postEl.innerHTML = `
      <header class="user-post__header">
        <img class="user-post__avatar" src="${p.autorAvatar || ""}" alt="avatar">
        <div class="user-post__meta">
          <h2 class="user-post__name">${p.autorNome || "Usuária"}</h2>
          <small class="user-post__date">${new Date(p.criadoEm).toLocaleString()}</small>
        </div>
      </header>

      <p class="user-post__caption">${(p.texto || "").replace(/\n/g, "<br>")}</p>
      ${p.imagem
        ? `<img class="user-post__image" src="${p.imagem}" alt="imagem do post">`
        : ""
      }

      <div class="post-acoes">
        <button class="btn-like ${liked ? "liked" : ""}" aria-label="Curtir post">
          <svg class="heart-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.28 2 8.5
            2 6.02 4.02 4 6.5 4c1.74 0 3.41.81 4.5 2.09
            C12.09 4.81 13.76 4 15.5 4
            17.98 4 20 6.02 20 8.5
            c0 3.78-3.14 6.86-8.9 11.86z"/>
          </svg>
          <span class="like-count">${p.likes || 0}</span>
        </button>
        <button class="btn-toggle-comments">💬 Comentários (${p.comentarios?.length || 0})</button>
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

    feed.appendChild(postEl);
  }

  attachEvents(feed);
}

/* ========= Render Comentários ========= */
function renderComentariosHTML(comentarios) {
  if (!comentarios.length)
    return `<p class="sem-comentarios">Ainda não há comentários.</p>`;

  return comentarios.map(c => {
    const user = getUsuarioAtual();
    const liked = c.likedBy?.includes(user?.email);
    return `
      <div class="comentario" data-id="${c.id}">
        <strong>${c.usuario}</strong>: ${c.texto}
        <button class="btn-like-comentario ${liked ? "liked" : ""}" aria-label="Curtir comentário">
          <svg class="heart-icon" viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.28 2 8.5
            2 6.02 4.02 4 6.5 4c1.74 0 3.41.81 4.5 2.09
            C12.09 4.81 13.76 4 15.5 4
            17.98 4 20 6.02 20 8.5
            c0 3.78-3.14 6.86-8.9 11.86z"/>
          </svg>
          <span class="like-count">${c.likes || 0}</span>
        </button>
      </div>
    `;
  }).join("");
}

/* ========= Eventos ========= */
function attachEvents(feed) {
  // Comentários
  $$(".btn-comentar", feed).forEach(btn => {
    btn.onclick = (e) => {
      const postEl = e.target.closest(".user-post");
      const id = Number(postEl.dataset.id);
      const input = postEl.querySelector(".input-comentario");
      const texto = input.value.trim();
      if (!texto) return alert("Digite algo.");
      const user = getUsuarioAtual();
      if (!user) return alert("Faça login para comentar.");

      const posts = getPosts();
      const post = posts.find(p => p.id === id);
      if (!post) return;
      post.comentarios = post.comentarios || [];
      post.comentarios.push({
        id: Date.now(),
        usuario: user.nome,
        texto,
        likes: 0,
        likedBy: []
      });
      setPosts(posts);

      // atualiza apenas a área de comentários
      const list = postEl.querySelector(".comentarios-list");
      list.innerHTML = renderComentariosHTML(post.comentarios);
      input.value = "";
      attachEvents(feed); // reata eventos novos
    };
  });

  // Likes nos posts
  $$(".btn-like", feed).forEach(btn => {
    btn.onclick = (e) => {
      const user = getUsuarioAtual();
      if (!user) return alert("Faça login para curtir.");
      const postEl = e.target.closest(".user-post");
      const id = Number(postEl.dataset.id);
      const posts = getPosts();
      const post = posts.find(p => p.id === id);
      if (!post) return;

      post.likedBy = post.likedBy || [];
      post.likes = post.likes || 0;

      const i = post.likedBy.indexOf(user.email);
      if (i >= 0) {
        post.likedBy.splice(i, 1);
        post.likes--;
      } else {
        post.likedBy.push(user.email);
        post.likes++;
      }
      setPosts(posts);

      // atualiza só o botão
      const countEl = btn.querySelector(".like-count");
      countEl.textContent = post.likes;
      btn.classList.toggle("liked", i < 0);
    };
  });

  // Likes nos comentários
  $$(".btn-like-comentario", feed).forEach(btn => {
    btn.onclick = (e) => {
      const user = getUsuarioAtual();
      if (!user) return alert("Faça login para curtir.");
      const postEl = e.target.closest(".user-post");
      const commentEl = e.target.closest(".comentario");
      const postId = Number(postEl.dataset.id);
      const commentId = Number(commentEl.dataset.id);

      const posts = getPosts();
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const c = post.comentarios.find(x => x.id === commentId);
      if (!c) return;

      c.likedBy = c.likedBy || [];
      c.likes = c.likes || 0;

      const i = c.likedBy.indexOf(user.email);
      if (i >= 0) {
        c.likedBy.splice(i, 1);
        c.likes--;
      } else {
        c.likedBy.push(user.email);
        c.likes++;
      }

      setPosts(posts);

      // atualiza visual
      const countEl = btn.querySelector(".like-count");
      countEl.textContent = c.likes;
      btn.classList.toggle("liked", i < 0);
    };
  });

  // Mostrar / esconder comentários
  $$(".btn-toggle-comments", feed).forEach(btn => {
    btn.onclick = (e) => {
      const postEl = e.target.closest(".user-post");
      const sec = postEl.querySelector(".comentarios");
      const isVisible = getComputedStyle(sec).display !== "none";
      sec.style.display = isVisible ? "none" : "block";
      btn.textContent = isVisible
        ? `💬 Comentários (${postEl.querySelectorAll(".comentario").length})`
        : "🔽 Ocultar comentários";
    };
  });
}

/* ========= Inicialização ========= */
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", init);
else
  init();
