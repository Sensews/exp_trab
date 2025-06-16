// Seleciona o modal de edição de perfil
const modal = document.getElementById('modal');

// Variável para armazenar o tipo atual de usuário
let tipoUsuarioAtual = 'jogador';

// Abre o modal e preenche os campos com os dados do perfil
function abrirModal() {
  modal.classList.add('open');

  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      document.getElementById('inputNome').value = data.nome || '';
      document.getElementById('inputArroba').value = (data.arroba || '').replace('@', '');
      document.getElementById('inputBio').value = data.bio || '';
      document.getElementById('inputLocal').value = data.local || '';
      document.getElementById('inputAniversario').value = data.aniversario || '';
      document.getElementById('contadorBio').textContent = `${data.bio?.length || 0} / 160`;

      if (data.banner) {
        const banner = document.getElementById('modalBanner');
        banner.style.backgroundImage = `url('${data.banner}')`;
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
      }

      if (data.tipo) {
        tipoUsuarioAtual = data.tipo;
        atualizarTipo(data.tipo);
      }
    });
}

// Salva os dados do perfil
function salvarPerfil() {
  const nome = document.getElementById('inputNome').value.trim();
  const arroba = document.getElementById('inputArroba').value.trim();
  const bio = document.getElementById('inputBio').value;
  const local = document.getElementById('inputLocal').value;
  const aniversario = document.getElementById('inputAniversario').value;
  const avatar = document.getElementById('modalAvatar').src;
  const banner = document.getElementById('modalBanner').style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

  if (!nome || !arroba) return alert("Nome e usuário são obrigatórios!");
  if (nome.length > 30) return alert("O nome não pode ter mais que 30 caracteres.");
  if (arroba.length > 15) return alert("O nome de usuário não pode ter mais que 15 caracteres.");

  const dados = {
    nome,
    arroba,
    bio,
    local,
    aniversario,
    avatar,
    banner,
    tipo: tipoUsuarioAtual
  };

  // Mostrar feedback visual que está processando
  const btnSalvar = document.getElementById("btnSalvar");
  const textoOriginal = btnSalvar.textContent;
  btnSalvar.textContent = "Salvando...";
  btnSalvar.disabled = true;

  fetch("../backend/perfil.php?action=salvar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  })
    .then(res => {
      // Verificar se a resposta é um redirecionamento
      if (res.redirected) {
        throw new Error("Redirecionado para: " + res.url);
      }
      
      // Verificar se é uma resposta bem-sucedida
      if (!res.ok) {
        throw new Error("Erro no servidor: " + res.status);
      }
      
      // Verificar tipo de conteúdo
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta não-JSON recebida");
      }
      
      return res.json();
    })
    .then(res => {
      if (res.status === "ok") {
        alert("Perfil atualizado!");
        atualizarPerfil();
        modal.classList.remove("open");
      } else {
        alert("Erro ao salvar: " + res.msg);
      }
    })
    .catch(err => {
      console.error("Erro ao salvar perfil:", err);
      alert("Ocorreu um erro ao salvar o perfil. Por favor, tente novamente.");
    })
    .finally(() => {
      // Restaurar estado do botão
      btnSalvar.textContent = textoOriginal;
      btnSalvar.disabled = false;
    });
}

// Atualiza os dados do perfil na tela
function atualizarPerfil() {
  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      document.getElementById('nome').textContent = data.nome || 'Seu nome';
      document.getElementById('arroba').textContent = '@' + (data.arroba || 'seuarroba');
      document.getElementById('arrobaPost').textContent = '@' + (data.arroba || 'seuarroba');
      document.getElementById('bio').textContent = data.bio || 'Sua bio aqui';
      document.getElementById('local').textContent = data.local || 'Sua cidade';
      document.getElementById('aniversario').textContent = data.aniversario
        ? `Aniversário: ${data.aniversario.split('-').reverse().join('/')}`
        : 'Aniversário: DD/MM/AAAA';

      const avatar = data.avatar || 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png';
      document.getElementById('avatar').src = avatar;
      document.getElementById('modalAvatar').src = avatar;
      document.getElementById("iconHeader").src = avatar;

      if (data.banner) {
        const banner = document.getElementById('banner');
        banner.style.backgroundImage = `url('${data.banner}')`;
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
      }

      tipoUsuarioAtual = data.tipo || 'jogador';
      atualizarTipo(tipoUsuarioAtual);
    });
}

// Altera o texto do tipo de usuário e botão de ação
function atualizarTipo(tipo) {
  const tipoTexto = document.getElementById('tipoUsuarioTexto');
  const btnTrocar = document.getElementById('alternarTipoBtn');
  const acoes = document.getElementById('acoesTipoUsuario');

  tipoTexto.textContent = `Tipo: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
  btnTrocar.textContent = tipo === 'jogador' ? 'Tornar-se Mestre' : 'Voltar a ser Jogador';

  acoes.innerHTML = '';
  const btn = document.createElement('button');
  btn.textContent = tipo === 'jogador' ? 'Entrar em Party' : 'Criar Party';
  btn.onclick = () => {
    const destino = tipo === 'jogador' ? 'entrar_party.html' : 'criar_party.html';
    window.location.href = destino;
  };
  acoes.appendChild(btn);
}

// Alterna tipo de usuário e salva
document.getElementById('alternarTipoBtn').addEventListener('click', () => {
  if (tipoUsuarioAtual === 'mestre' && !confirm("Deseja voltar a ser Jogador?\n⚠️ Sua party será excluída...")) return;

  tipoUsuarioAtual = tipoUsuarioAtual === 'jogador' ? 'mestre' : 'jogador';
  atualizarTipo(tipoUsuarioAtual);

  fetch("../backend/perfil.php?action=salvar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: document.getElementById("nome").textContent,
      arroba: document.getElementById("arroba").textContent.replace("@", ""),
      bio: document.getElementById("bio").textContent,
      local: document.getElementById("local").textContent,
      aniversario: "",
      avatar: document.getElementById("avatar").src,
      banner: document.getElementById("banner").style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''),
      tipo: tipoUsuarioAtual
    })
  }).then(() => {
    atualizarPerfil();
    modal.classList.remove("open"); // FECHAR MODAL 
  });
});

// Redimensiona imagens antes de salvar
function resizeAndStoreImage(file, width, height, callback) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      callback(resizedDataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById('inputAvatar').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    resizeAndStoreImage(file, 130, 130, (resizedUrl) => {
      document.getElementById('modalAvatar').src = resizedUrl;
    });
  }
});

document.getElementById('inputBanner').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    resizeAndStoreImage(file, 800, 200, (resizedUrl) => {
      const modalBanner = document.getElementById('modalBanner');
      modalBanner.style.backgroundImage = `url('${resizedUrl}')`;
      modalBanner.style.backgroundSize = 'cover';
      modalBanner.style.backgroundPosition = 'center';
    });
  }
});

document.getElementById('inputBio').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
  document.getElementById('contadorBio').textContent = `${this.value.length} / 160`;
});

// Carrega perfil e posts ao abrir página
window.onload = () => {
  atualizarPerfil();
  carregarPostsDoPerfil();
};

// Exibe os posts do usuário
function carregarPostsDoPerfil() {
  fetch("../backend/perfil.php?action=postsUsuario")
    .then(res => res.json())
    .then(posts => {
      const container = document.getElementById("postsPerfil");
      if (!container) return;

      container.innerHTML = "";
      posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "post-perfil";
        div.innerHTML = `
          <p>${post.texto}</p>
          ${post.imagem ? `<img src="../backend/${post.imagem}" alt="Imagem do post" style="max-width:100%; border-radius:8px;" />` : ""}
          <small>${new Date(post.criado_em).toLocaleString()}</small>
        `;
        container.appendChild(div);
      });
    });
}

// Vincula botão "Salvar" com a função
document.getElementById("btnSalvar").addEventListener("click", salvarPerfil);
