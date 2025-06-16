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

  const dados = {
    action: "criarPost",
    texto: text
  };

  // Se tiver imagem, converte para base64
  if (file) {
    const reader = new FileReader();
    reader.onload = function() {
      dados.imagem = reader.result;
      enviarPost(dados);
    };
    reader.readAsDataURL(file);
  } else {
    enviarPost(dados);
  }
}

async function enviarPost(dados) {
  try {
    const response = await window.secureFetch.securePost(
      "../backend/teste_post-seguro.php", 
      dados
    );

    if (response.sucesso) {
      response.arroba = perfilAtual.arroba || "usuario";
      response.avatar = perfilAtual.avatar || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
      exibirPostNoFeed(response);
      document.getElementById("postText").value = "";
      document.getElementById("postImage").value = "";
    } else {
      alert("Erro ao postar: " + (response.erro || "resposta inválida"));
    }
  } catch (error) {
    console.error("Erro no post seguro:", error);
    alert("Erro na comunicação segura");
  }return;

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

function exibirPostNoFeed(post) {
  const tweet = document.createElement("div");
  tweet.className = "tweet";
  tweet.setAttribute("data-id", post.id);

  const header = document.createElement("div");
  header.className = "post-header";

  const avatar = document.createElement("img");
  avatar.src = post.avatar || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
  avatar.alt = "Avatar do usuário";
  // Aplica estilo direto para garantir que fique redondo
  avatar.style.width = "36px";
  avatar.style.height = "36px";
  avatar.style.borderRadius = "50%";
  avatar.style.objectFit = "cover";
  avatar.style.border = "2px solid #00FFAA";
  avatar.style.display = "block";
  avatar.style.flexShrink = "0";

  const autor = document.createElement("span");
  autor.className = "autor";
  autor.textContent = `@${post.arroba || "usuario"}`;

  header.appendChild(avatar);
  header.appendChild(autor);
  tweet.appendChild(header);

  const textDiv = document.createElement("div");
  textDiv.className = "text";
  textDiv.textContent = post.texto;
  tweet.appendChild(textDiv);

  if (post.imagem) {
    const img = document.createElement("img");
    img.src = "../backend/" + post.imagem;
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    img.style.marginTop = "8px";
    tweet.appendChild(img);
  }

  adicionarInteracoes(tweet, post.id);
  document.getElementById("feed").prepend(tweet);
}

function adicionarInteracoes(tweet, postId) {
  const actions = document.createElement("div");
  actions.className = "actions";

  const likeButton = document.createElement("button");
  likeButton.className = "like-btn";
  let curtido = false;
  let count = 0;

  fetch(`../backend/teste_post.php?action=verificarCurtida&id_post=${postId}`)
    .then(res => res.json())
    .then(data => {
      curtido = data.curtido;
      count = data.total;
      likeButton.innerHTML = `❤️ Curtir (<span>${count}</span>)`;
    });

  likeButton.onclick = () => {
    fetch("../backend/teste_post.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `action=${curtido ? "removerCurtida" : "curtir"}&id_post=${postId}`
    })
    .then(res => res.json())
    .then(() => {
      curtido = !curtido;
      count += curtido ? 1 : -1;
      likeButton.innerHTML = `❤️ Curtir (<span>${count}</span>)`;
    });
  };

  actions.appendChild(likeButton);
  tweet.appendChild(actions);

  const chatArea = document.createElement("div");
  chatArea.className = "chat-area";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Comentar...";

  const commentBtn = document.createElement("button");
  commentBtn.textContent = "Enviar";

  const commentList = document.createElement("div");
  commentList.className = "comments";

  commentBtn.onclick = () => {
    const commentText = input.value.trim();
    if (commentText === "") return;

    const formData = new URLSearchParams();
    formData.append("action", "comentar");
    formData.append("id_post", postId);
    formData.append("comentario", commentText);

    fetch("../backend/teste_post.php", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.sucesso) {
        const comment = document.createElement("div");
        comment.className = "comment";
        comment.textContent = commentText;
        commentList.appendChild(comment);
        input.value = "";
      }
    });
  };

  chatArea.appendChild(input);
  chatArea.appendChild(commentBtn);
  tweet.appendChild(chatArea);
  tweet.appendChild(commentList);
}