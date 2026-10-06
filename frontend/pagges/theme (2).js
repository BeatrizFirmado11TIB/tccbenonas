/* ============ ALTERNAR MODO CLARO / ESCURO ============ */
/* A escolha fica SALVA: se ativar o modo escuro em uma página,
   ele continua ativo nas outras. Só volta ao claro ao clicar de novo. */
(function () {
  var root = document.documentElement;

  // 1. Ao carregar, aplica o tema salvo (se houver). Sem salvo = modo claro.
  try {
    if (localStorage.getItem("petrotech-theme") === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  } catch (e) {
    /* localStorage indisponível: ignora */
  }

  // 2. Liga o botão do menu
  function init() {
    var btn = document.querySelector(".theme-btn");
    if (!btn) return;

    btn.setAttribute(
      "aria-label",
      root.classList.contains("dark")
        ? "Ativar modo claro"
        : "Ativar modo escuro"
    );

    btn.addEventListener("click", function () {
      var isDark = root.classList.toggle("dark");
      try {
        if (isDark) {
          localStorage.setItem("petrotech-theme", "dark");
        } else {
          localStorage.removeItem("petrotech-theme");
        }
      } catch (e) {
        /* localStorage indisponível: ignora */
      }
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