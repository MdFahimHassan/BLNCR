// Sets the light/dark class before first paint, so there's never a flash of the wrong theme
// while React boots. Mirrors the stored-preference-then-system-preference logic ThemeContext
// uses after mount.
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
