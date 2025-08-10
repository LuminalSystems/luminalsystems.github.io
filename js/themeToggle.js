// themeToggle.js

function setTheme(theme) {
    document.body.id = `theme-${theme}`;
    localStorage.setItem("theme", theme);
  }
  
  function initTheme() {
    const theme = localStorage.getItem("theme") || "dark";
    document.body.id = `theme-${theme}`;
  }
  
  window.TLL_ThemeEngine = { setTheme, initTheme };
  window.addEventListener("DOMContentLoaded", initTheme);
  