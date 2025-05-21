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

// Atualização da imagem de perfil via banco de dados
  fetch("../backend/perfil.php?action=carregar")
    .then(response => response.json())
    .then(data => {
      const iconHeader = document.getElementById("iconHeader");
      const iconHeaderMobile = document.getElementById("iconHeaderMobile");

      console.log("Avatar recebido:", data.avatar);

      if (data.avatar) {
        if (iconHeader) {
          iconHeader.src = data.avatar;
          console.log("Avatar aplicado no iconHeader");
        }
        if (iconHeaderMobile) {
          iconHeaderMobile.src = data.avatar;
          console.log("Avatar aplicado no iconHeaderMobile");
        }
      } else {
        console.warn("Avatar vazio no retorno.");
      }
    })
    .catch(error => console.error("Erro ao carregar avatar:", error));

});