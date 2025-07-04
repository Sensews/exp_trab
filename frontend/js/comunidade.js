let perfilAtual = {};

document.addEventListener("DOMContentLoaded", async () => {
  // Verifica se a sessão está ativa
  try {
    const res = await fetch("../backend/verificar_sessao.php");
    const dados = await res.json();

    if (!dados.logado) {
      window.location.href = "../frontend/erro.html";
      return;
    }

    document.body.style.display = "block";
  } catch (e) {
    window.location.href = "../frontend/erro.html";
    return;
  }

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

async function postar() {
  const text = document.getElementById("postText").value.trim();
  const fileInput = document.getElementById("postImage");
  const file = fileInput.files[0];

  if (text === "" && !file) return;

  try {
    let processedFile = null;
    
    // Se há uma imagem, comprimir antes de enviar
    if (file) {
      // Validar imagem
      const validation = ImageCompressor.validateImage(file, 5); // 5MB máximo
      if (!validation.valid) {
        alert(validation.error);
        return;
      }      // Mostrar indicador de processamento
      const postButton = document.getElementById('postButton');
      const originalText = postButton.textContent;
      postButton.textContent = 'Processando imagem...';
      postButton.disabled = true;

      try {
        // Comprimir imagem (máximo 800x600, qualidade 0.8)
        const compressedBase64 = await ImageCompressor.compressImage(file, 800, 600, 0.8);
        
        // Criar objeto File simulado com o base64
        processedFile = {
          name: file.name,
          type: 'image/jpeg',
          base64: compressedBase64
        };

        console.log(`Imagem comprimida: ${Math.round(compressedBase64.length * 0.75 / 1024)} KB`);
        
      } catch (error) {
        console.error('Erro ao comprimir imagem:', error);
        alert('Erro ao processar imagem. Tente novamente.');
        return;
      } finally {
        // Restaurar botão
        postButton.textContent = originalText;
        postButton.disabled = false;
      }
    }

    // Tentar usar criptografia primeiro
    if (window.simpleSecureClient && window.simpleSecureClient.initialized) {
      // Usar criptografia
      const postData = { texto: text };
      
      const post = await window.simpleSecureClient.createPost(postData, processedFile);
      if (post.sucesso) {
        post.arroba = perfilAtual.arroba || "usuario";
        post.avatar = perfilAtual.avatar || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
        exibirPostNoFeed(post);
        document.getElementById("postText").value = "";
        document.getElementById("postImage").value = "";
      } else {
        alert("Erro ao postar: " + (post.erro || "resposta inválida"));
      }
    } else {
      // Fallback: método não criptografado (usar imagem original para compatibilidade)
      const formData = new FormData();
      formData.append("action", "criarPost");
      formData.append("texto", text);
      if (file) formData.append("imagem", file);

      const response = await fetch("../backend/teste_post.php", {
        method: "POST",
        body: formData
      });
      
      const post = await response.json();
      if (post.sucesso) {
        post.arroba = perfilAtual.arroba || "usuario";
        post.avatar = perfilAtual.avatar || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
        exibirPostNoFeed(post);
        document.getElementById("postText").value = "";
        document.getElementById("postImage").value = "";
      } else {
        alert("Erro ao postar: " + (post.erro || "resposta inválida"));
      }
    }
  } catch (error) {
    console.error('Erro ao postar:', error);
    alert("Erro ao postar. Tente novamente.");
  }
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
    // Se a imagem já é base64, usar diretamente, senão adicionar o prefixo para arquivos antigos
    if (post.imagem.startsWith('data:')) {
      img.src = post.imagem;
    } else {
      img.src = "../backend/" + post.imagem;
    }
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