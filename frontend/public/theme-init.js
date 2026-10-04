// Sets the light/dark class before first paint to avoid a flash; mirrors ThemeContext's preference logic.
(function () {
  try {
    var stored = localStorage.getItem("blncr_theme");
    var wantsLight =
      stored === "light" ||
      (!stored &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: light)").matches);
    if (wantsLight) document.documentElement.classList.add("light");
  } catch (e) {}
})();
