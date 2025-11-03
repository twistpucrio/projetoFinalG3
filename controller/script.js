/* js/guard.js */
"use strict";

// Páginas protegidas por login
const PROTECTED_PAGES = ["posts.html", "empregos.html", "empresas.html"];

// Helper: pega o último segmento do pathname (ex.: "/site/pasta/posts.html" -> "posts.html")
function lastSegment(pathname) {
  if (!pathname) return "";
  const segs = pathname.split("/").filter(Boolean);
  return segs[segs.length - 1] || "";
}

// Helper: verifica se há usuarioAtual válido no localStorage
function isLoggedIn() {
  try {
    const raw = localStorage.getItem("usuarioAtual");
    if (!raw) return false;
    const u = JSON.parse(raw);
    return !!u && typeof u === "object" && !!(u.email || u.nome);
  } catch {
    return false;
  }
}

// Redireciona com alerta para perfil.html
function denyAndRedirect() {
  alert("Você precisa estar logado para acessar esta página.");
  window.location.href = "perfil.html";
}

// 1) Bloqueio ao abrir páginas protegidas diretamente
window.addEventListener("DOMContentLoaded", () => {
  const current = lastSegment(window.location.pathname);
  if (PROTECTED_PAGES.includes(current) && !isLoggedIn()) {
    denyAndRedirect();
  }
});

// 2) Bloqueio ao clicar em links para páginas protegidas (em qualquer página)
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a) return;

  let href = a.getAttribute("href") || "";
  // ignora links externos/anchors/mailto/tel
  if (/^(https?:)?\/\//i.test(href) || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return;
  }

  // Normaliza para só o arquivo (remove query/hash)
  href = href.split("#")[0].split("?")[0];
  const targetFile = lastSegment(href);

  if (PROTECTED_PAGES.includes(targetFile) && !isLoggedIn()) {
    e.preventDefault();
    denyAndRedirect();
  }
});
