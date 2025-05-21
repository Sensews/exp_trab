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

function postar() {
  const text = document.getElementById("postText").value.trim();
  const fileInput = document.getElementById("postImage");
  const file = fileInput.files[0];

  if (text === "" && !file) return;

  const formData = new FormData();
  formData.append("action", "criarPost");
  formData.append("texto", text);
  if (file) formData.append("imagem", file);

  fetch("../backend/teste_post.php", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(post => {
    if (post.sucesso) {
      // Usa o perfil real
      post.arroba = perfilAtual.arroba || "usuario";
      post.avatar = perfilAtual.avatar || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
      exibirPostNoFeed(post);
      document.getElementById("postText").value = "";
      document.getElementById("postImage").value = "";
    } else {
      alert("Erro ao postar: " + (post.erro || "resposta inválida"));
    }
  });
}

