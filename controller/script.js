/* js/guard.js */
"use strict";

/*  
   Este arquivo agora contém APENAS o guard de navegação.
   Nada relacionado a perfis, posts ou botões deve ficar aqui.
   Isso evita que outras páginas que não têm esses elementos quebrem,
   e impede que a execução do JS seja interrompida.
*/


// =======================
//  Páginas protegidas
// =======================
const PROTECTED_PAGES = ["posts.html", "empregos.html", "empresas.html"];

// Extrai o último segmento do caminho
function lastSegment(pathname) {
  if (!pathname) return "";
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

// Verifica se existe um usuário logado
function isLoggedIn() {
  try {
    const raw = localStorage.getItem("usuarioAtual");
    if (!raw) return false;
    const u = JSON.parse(raw);
    return !!u && typeof u === "object" && (u.email || u.nome);
  } catch {
    return false;
  }
}

// Redireciona para o perfil se não houver login
function denyAndRedirect() {
  alert("Você precisa estar logado para acessar esta página.");
  window.location.href = "perfil.html";
}


// =======================
//  BLOQUEIO AO ABRIR PÁGINA
// =======================
window.addEventListener("DOMContentLoaded", () => {
  const currentFile = lastSegment(window.location.pathname);

  if (PROTECTED_PAGES.includes(currentFile) && !isLoggedIn()) {
    denyAndRedirect();
  }
});


// =======================
//  BLOQUEIO AO CLICAR EM LINKS
// =======================
document.addEventListener("click", (e) => {
  const link = e.target.closest("a[href]");
  if (!link) return;

  let href = link.getAttribute("href") || "";

  // Ignorar links externos e anchors
  if (
    /^(https?:)?\/\//i.test(href) ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) return;

  // Normalizar
  href = href.split("#")[0].split("?")[0];
  const targetFile = lastSegment(href);

  if (PROTECTED_PAGES.includes(targetFile) && !isLoggedIn()) {
    e.preventDefault();
    denyAndRedirect();
  }
});

// =======================
//  FIM DO ARQUIVO
// =======================
//
//  Nada mais deve ser colocado aqui.
//  Perfil, posts e mensagens são tratados
//  exclusivamente pelos outros arquivos.
//
