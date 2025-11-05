/* controller/postar.js */
"use strict";

/* ========= Utils ========= */
const $ = (sel, root = document) => root.querySelector(sel);
const show = (el) => { if (el) el.style.display = "block"; };
const hide = (el) => { if (el) el.style.display = "none"; };

const getUsuarioAtual = () => {
  try { return JSON.parse(localStorage.getItem("usuarioAtual") || "null"); }
  catch { return null; }
};
const getPosts = () => {
  try { return JSON.parse(localStorage.getItem("posts") || "[]"); }
  catch { return []; }
};
const setPosts = (arr) => localStorage.setItem("posts", JSON.stringify(arr));

/* ========= Helpers de imagem ========= */

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

function dataURLBytes(dataURL) {
  if (!dataURL) return 0;
  const base64 = dataURL.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

async function comprimirImagem(file, maxW = 1200, maxH = 1200, qualities = [0.8, 0.6, 0.4], targetBytes = 350 * 1024) {
  const rawDataURL = await lerArquivoComoDataURL(file);
  const img = await carregarImagem(rawDataURL);
  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1);
  const outW = Math.round(width * ratio);
  const outH = Math.round(height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, outW, outH);
  for (const q of qualities) {
    const out = canvas.toDataURL("image/jpeg", q);
    const bytes = dataURLBytes(out);
    if (bytes <= targetBytes) return out;
    var last = out;
  }
  return last;
}

function getPostsPath() {
  if (location.pathname.includes("/view/")) return "posts.html";
  return "view/posts.html";
}

/* ========= Init ========= */
function init() {
  console.log("[postar.js] carregado");
  const usuario = getUsuarioAtual();
  const perfilView = $("#perfil-view");
  const toolbar = $("#post-toolbar");
  if (perfilView && usuario && toolbar) show(toolbar);

  const btnNovoPost = $("#btn-novo-post");
  const formNovoPost = $("#form-novo-post");
  if (btnNovoPost && formNovoPost) {
    btnNovoPost.addEventListener("click", () => {
      const visivel = getComputedStyle(formNovoPost).display !== "none";
      visivel ? hide(formNovoPost) : show(formNovoPost);
      $("#texto-post")?.focus();
    });
  }

  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form || form.id !== "form-novo-post") return;
    e.preventDefault();

    const user = getUsuarioAtual();
    if (!user) {
      alert("Faça login para postar.");
      window.location.href = "perfil.html";
      return;
    }

    const txt = $("#texto-post");
    const img = $("#imagem-post");
    if (!txt) return alert("Campo de texto não encontrado (#texto-post).");
    const texto = (txt.value || "").trim();
    if (!texto) return alert("Escreva algo no post.");
    if (!img) return alert("Input de imagem não encontrado (#imagem-post).");

    const file = img.files && img.files[0] ? img.files[0] : null;
    if (!file) return alert("Selecione uma imagem para o post.");
    if (!file.type.startsWith("image/")) return alert("O arquivo precisa ser uma imagem.");

    let dataURL;
    try {
      dataURL = await comprimirImagem(file, 1200, 1200, [0.8, 0.6, 0.4], 350 * 1024);
      const kb = Math.round(dataURLBytes(dataURL) / 1024);
      console.log(`[postar.js] imagem final ~${kb} KB`);
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      alert("Não foi possível ler a imagem. Tente novamente.");
      return;
    }

    const novoPost = {
      id: Date.now(),
      autorNome: user.nome || "Usuária",
      autorAvatar: user.avatar || "",
      texto,
      imagem: dataURL,
      criadoEm: new Date().toISOString(),
      comentarios: [],
      likes: 0,
      likedBy: []
    };

    try {
      const lista = getPosts();
      lista.unshift(novoPost);
      setPosts(lista);
    } catch (err) {
      console.error("Erro ao salvar post:", err);
      alert("Não foi possível salvar seu post. Dica: reduza a imagem ou limpe posts antigos.");
      return;
    }

    form.reset();
    hide(form);
    window.location.href = getPostsPath();
  });

  const feed = $("#feed-posts");
  if (feed) renderFeed(feed);
}

/* ========= Render Feed ========= */
function renderFeed(feed) {
  const posts = getPosts();

  const tpl = (p) => `
  <article class="user-post" data-id="${p.id}">
    <header class="user-post__header">
      <img class="user-post__avatar" src="${p.autorAvatar || ""}" alt="avatar">
      <div class="user-post__meta">
        <h2 class="user-post__name">${p.autorNome || "Usuária"}</h2>
        <small class="user-post__date">${new Date(p.criadoEm).toLocaleString()}</small>
      </div>
    </header>

    <p class="user-post__caption">${(p.texto || "").replace(/\n/g, "<br>")}</p>

    <img class="user-post__image" src="${p.imagem}" alt="imagem do post">

    <div class="post-acoes">
        <button class="btn-like ${p.likedBy?.includes(getUsuarioAtual()?.email) ? "liked" : ""}" aria-label="Curtir">
          <svg class="heart-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12.1 21.35l-1.1-.99C5.14 15.36 2 12.28 2 8.5 2 6.02 4.02 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 17.98 4 20 6.02 20 8.5c0 3.78-3.14 6.86-8.9 11.86l-1 0z"/>
          </svg>
          <span class="like-count">${p.likes || 0}</span>
        </button>
      <button class="btn-toggle-comments">💬 Comentários (${p.comentarios?.length || 0})</button>
    </div>

    <section class="comentarios" style="display:none;">
      <h4>Comentários</h4>
      <div class="comentarios-list">
        ${p.comentarios && p.comentarios.length
          ? p.comentarios.map(c => `
              <div class="comentario">
                <strong>${c.usuario}</strong>: ${c.texto}
              </div>
            `).join("")
          : "<p class='sem-comentarios'>Ainda não há comentários.</p>"
        }
      </div>
      <div class="novo-comentario">
        <input type="text" class="input-comentario" placeholder="Escreva um comentário...">
        <button class="btn-comentar">Enviar</button>
      </div>
    </section>
  </article>
`;

  feed.innerHTML = posts.length
    ? posts.map(tpl).join("")
    : `<div class="post"><p class="legenda_post">Ainda não há posts. Crie um no perfil com o botão <strong>+</strong>.</p></div>`;

  attachCommentEvents(feed);
  attachLikeEvents(feed);
  attachToggleCommentsEvents(feed);
}

/* ========= Eventos de comentário ========= */
function attachCommentEvents(feed) {
  feed.querySelectorAll(".btn-comentar").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const postEl = e.target.closest(".user-post");
      const id = Number(postEl.dataset.id);
      const input = postEl.querySelector(".input-comentario");
      const texto = input.value.trim();
      if (!texto) return alert("Digite algo para comentar.");
      const user = getUsuarioAtual();
      if (!user) return alert("Faça login para comentar.");

      const posts = getPosts();
      const post = posts.find(p => p.id === id);
      if (!post) return;

      post.comentarios = post.comentarios || [];
      post.comentarios.push({ usuario: user.nome || "Usuária", texto });
      setPosts(posts);
      input.value = "";
      renderFeed(feed);
    });
  });
}

/* ========= Eventos de like ========= */
function attachLikeEvents(feed) {
  feed.querySelectorAll(".btn-like").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const user = getUsuarioAtual();
      if (!user) return alert("Faça login para curtir.");

      const postEl = e.target.closest(".user-post");
      const id = Number(postEl.dataset.id);
      const posts = getPosts();
      const post = posts.find(p => p.id === id);
      if (!post) return;

      post.likedBy = post.likedBy || [];
      post.likes = post.likes || 0;

      const alreadyLiked = post.likedBy.includes(user.email);
      if (alreadyLiked) {
        post.likes--;
        post.likedBy = post.likedBy.filter(u => u !== user.email);
      } else {
        post.likes++;
        post.likedBy.push(user.email);
      }

      setPosts(posts);
      renderFeed(feed);
    });
  });
}

/* ========= Mostrar / Esconder Comentários ========= */
function attachToggleCommentsEvents(feed) {
  feed.querySelectorAll(".btn-toggle-comments").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const postEl = e.target.closest(".user-post");
      const commentsSection = postEl.querySelector(".comentarios");
      const visible = getComputedStyle(commentsSection).display !== "none";
      commentsSection.style.display = visible ? "none" : "block";
      btn.textContent = visible
        ? `💬 Comentários (${postEl.querySelectorAll(".comentario").length})`
        : "🔽 Ocultar comentários";
    });
  });
}

/* ========= Inicialização ========= */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
