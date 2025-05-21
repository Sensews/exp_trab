let perfilAtual = {};

document.addEventListener("DOMContentLoaded", () => {
  // Primeiro, carrega o perfil do usuário atual
  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      perfilAtual = data;
    });

  // Depois, carrega os posts existentes
  fetch("../backend/teste_post.php?action=carregarPosts")
    .then(res => res.json())
    .then(posts => {
      posts.forEach(post => {
        exibirPostNoFeed(post);
      });
    });
});