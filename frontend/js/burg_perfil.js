// Tudo dentro de um único DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("burg.js carregado!");
  console.log("JS carregado: tentando buscar avatar...");

  // Menu hamburger
  const hamburger = document.getElementById("hamburgerMenuMobile");
  const mobileNav = document.querySelector(".mobile-nav");

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      mobileNav.classList.toggle("show");
      console.log("Menu hamburguer toggle");
    });
  }
});