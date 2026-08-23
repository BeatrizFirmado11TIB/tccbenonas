/* ============ ALTERNAR MODO CLARO / ESCURO ============ */
/* A página SEMPRE abre no MODO CLARO. O clique no botão leva ao MODO ESCURO. */
(function () {
  var root = document.documentElement;

  // 1. Garante o modo claro no carregamento (remove qualquer resquício salvo)
  root.classList.remove("dark");
  try {
    localStorage.removeItem("petrotech-theme");
  } catch (e) {
    /* localStorage indisponível: ignora */
  }

  // 2. Liga o botão do menu
  function init() {
    var btn = document.querySelector(".theme-btn");
    if (!btn) return;

    btn.setAttribute("aria-label", "Ativar modo escuro");

    btn.addEventListener("click", function () {
      var isDark = root.classList.toggle("dark");
      btn.setAttribute(
        "aria-label",
        isDark ? "Ativar modo claro" : "Ativar modo escuro"
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
