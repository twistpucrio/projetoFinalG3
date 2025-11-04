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

// Lê File -> DataURL bruto
const lerArquivoComoDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

// Carrega uma imagem a partir de DataURL/URL para usar no canvas
const carregarImagem = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Converte DataURL para tamanho em bytes (aprox)
function dataURLBytes(dataURL) {
  if (!dataURL) return 0;
  const base64 = dataURL.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Redimensiona e comprime uma imagem.
 * @param {File} file - arquivo de imagem
 * @param {number} maxW - largura máxima
 * @param {number} maxH - altura máxima
 * @param {number[]} qualities - lista de qualidades para tentar
 * @param {number} targetBytes - alvo máximo de bytes
 * @returns {Promise<string>} dataURL final (JPEG)
 */
async function comprimirImagem(file, maxW = 1200, maxH = 1200, qualities = [0.8, 0.6, 0.4], targetBytes = 350 * 1024) {
  // 1) Lê arquivo bruto
  const rawDataURL = await lerArquivoComoDataURL(file);
  // 2) Carrega p/ canvas
  const img = await carregarImagem(rawDataURL);

  // 3) Calcula dimensões finais
  let { width, height } = img;
  const ratio = Math.min(maxW / width, maxH / height, 1); // nunca amplia
  const outW = Math.round(width * ratio);
  const outH = Math.round(height * ratio);

  // 4) Desenha em canvas
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, outW, outH);

  // 5) Tenta qualidades até ficar abaixo do alvo
  for (const q of qualities) {
    const out = canvas.toDataURL("image/jpeg", q);
    const bytes = dataURLBytes(out);
    // console.log(`[compressão] q=${q} -> ${Math.round(bytes/1024)} KB`);
    if (bytes <= targetBytes) return out;
    var last = out; // guarda o último caso não atinja a meta
  }
  // Se nenhuma qualidade bateu a meta, retorna a última (menor) mesmo
  return last;
}

// Caminho robusto para o posts.html (funciona da raiz ou de /view)
function getPostsPath() {
  if (location.pathname.includes("/view/")) return "posts.html";
  return "view/posts.html";
}

/* ========= Init ========= */
function init() {
  console.log("[postar.js] carregado");

  // ---- PERFIL: mostra toolbar '+' se logado ----
  const usuario = getUsuarioAtual();
  const perfilView   = $("#perfil-view");
  const toolbar      = $("#post-toolbar");
  if (perfilView && usuario && toolbar) show(toolbar);

  // Toggle do formulário ao clicar no '+'
  const btnNovoPost  = $("#btn-novo-post");
  const formNovoPost = $("#form-novo-post");
  if (btnNovoPost && formNovoPost) {
    btnNovoPost.addEventListener("click", () => {
      const visivel = getComputedStyle(formNovoPost).display !== "none";
      visivel ? hide(formNovoPost) : show(formNovoPost);
      $("#texto-post")?.focus();
    });
  }

  // ---- DELEGAÇÃO: captura o submit do #form-novo-post com segurança ----
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form || form.id !== "form-novo-post") return;

    console.log("[postar.js] submit capturado");
    e.preventDefault();

    const user = getUsuarioAtual();
    if (!user) {
      alert("Faça login para postar.");
      window.location.href = "perfil.html";
      return;
    }

    const txt = $("#texto-post");
    const img = $("#imagem-post");

    if (!txt) { alert("Campo de texto não encontrado (#texto-post)."); return; }
    const texto = (txt.value || "").trim();
    if (!texto) { alert("Escreva algo no post."); return; }

    if (!img) { alert("Input de imagem não encontrado (#imagem-post)."); return; }
    const file = img.files && img.files[0] ? img.files[0] : null;
    if (!file)  { alert("Selecione uma imagem para o post."); return; }
    if (!file.type.startsWith("image/")) { alert("O arquivo precisa ser uma imagem."); return; }

    let dataURL;
    try {
      // Comprime/Redimensiona para caber no localStorage
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
      criadoEm: new Date().toISOString()
    };

    try {
      const lista = getPosts();
      lista.unshift(novoPost);          // mais recente primeiro
      setPosts(lista);
      console.log("[postar.js] post salvo. Total:", lista.length);
    } catch (err) {
      console.error("Erro ao salvar post:", err);
      alert("Não foi possível salvar seu post. Dica: reduza a imagem ou limpe posts antigos.");
      return;
    }

    form.reset();
    hide(form);
    window.location.href = getPostsPath(); // redireciona corretamente (raiz ou /view)
  });

  // ---- POSTS: renderiza feed onde existir #feed-posts ----
  const feed = $("#feed-posts");
  if (feed) {
    const posts = getPosts();
    const tpl = (p) => `
  <article class="user-post">
    <header class="user-post__header">
      <img class="user-post__avatar" src="${p.autorAvatar || ""}" alt="avatar">
      <div class="user-post__meta">
        <h2 class="user-post__name">${p.autorNome || "Usuária"}</h2>
        <small class="user-post__date">${new Date(p.criadoEm).toLocaleString()}</small>
      </div>
    </header>

    <p class="user-post__caption">${(p.texto || "").replace(/\n/g, "<br>")}</p>

    <img class="user-post__image" src="${p.imagem}" alt="imagem do post">
  </article>
`;

    feed.innerHTML = posts.length
      ? posts.map(tpl).join("")
      : `<div class="post"><p class="legenda_post">Ainda não há posts. Crie um no perfil com o botão <strong>+</strong>.</p></div>`;
  }
}

// Roda com ou sem defer
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
