// fotodeperfil.js
(function () {
  const DEFAULT_ICON = "img/perfil.png";

  function getUsuarioAtual() {
    try { return JSON.parse(localStorage.getItem("usuarioAtual") || "null"); }
    catch { return null; }
  }

  function setSrcWithFallback(img, src, fallback) {
    const handler = () => { img.removeEventListener("error", handler); img.src = fallback; };
    img.removeEventListener("error", handler);
    img.addEventListener("error", handler, { once: true });
    img.src = src;
  }

  function applyAvatarToHeader() {
    const img = document.getElementById("perfil");
    if (!img) return;

    const u = getUsuarioAtual();
    const desired = u?.avatar || DEFAULT_ICON;

    setSrcWithFallback(img, desired, DEFAULT_ICON);
    img.alt = u?.nome || "perfil";

    const link = img.closest("a");
    if (link) link.href = u ? "perfil.html" : "login.html";
  }

  function refreshHeaderAvatar() { applyAvatarToHeader(); }

  document.addEventListener("DOMContentLoaded", applyAvatarToHeader);
  window.addEventListener("storage", (e) => {
    if (e.key === "usuarioAtual") applyAvatarToHeader();
  });
  document.addEventListener("usuarioAtual:changed", applyAvatarToHeader);

  window.refreshHeaderAvatar = refreshHeaderAvatar;
})();
