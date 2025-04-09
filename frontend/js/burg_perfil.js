// Menu hamburger
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburgerMenuMobile");
  const mobileNav = document.querySelector(".mobile-nav");

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      mobileNav.classList.toggle("show");
    });
  }

  console.log("burg.js carregado!");
});

// Atualização foto perfil (desktop + mobile)
document.addEventListener("DOMContentLoaded", function () {
  const avatar = localStorage.getItem("avatar");

  const iconHeader = document.getElementById("iconHeader");
  const iconHeaderMobile = document.getElementById("iconHeaderMobile");

  if (avatar) {
    if (iconHeader) iconHeader.src = avatar;
    if (iconHeaderMobile) iconHeaderMobile.src = avatar;
  }
});

    // Dropdown do header 
  const dropdownBtn = document.querySelector('.dropdown .btn');
  if (dropdownBtn) {
    dropdownBtn.addEventListener('click', function () {
      document.querySelector('.dropdown-content').classList.toggle('show');
    });

  // Fecha dropdown ao clicar fora
    window.addEventListener('click', function (e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelector('.dropdown-content').classList.remove('show');
      }
    });
  };