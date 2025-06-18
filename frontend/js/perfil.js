// Aguarda o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", async () => {
  // Verifica se a sessão está ativa
  try {
    const res = await fetch("../backend/verificar_sessao.php"); 
    const dados = await res.json(); 

    if (!dados.logado) {
      // Redireciona para erro se não estiver logado
      window.location.href = "../frontend/erro.html";
      return;
    }

    // Exibe o conteúdo da página
    document.body.style.display = "block";
  } catch (e) {
    // Em caso de erro na requisição
    window.location.href = "../frontend/erro.html";
    return;
  }
  
  const modal = document.getElementById('modal');
  let tipoUsuarioAtual = 'jogador';

  // Redimensiona e converte imagem para base64
  function resizeAndStoreImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionamento proporcional
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        // Desenha imagem redimensionada no canvas
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        callback(dataUrl);
      };
      img.onerror = () => {
        alert("Erro ao carregar a imagem.");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Abre o modal de edição do perfil e carrega dados atuais
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

        const bannerElem = document.getElementById('modalBanner');
        bannerElem.style.backgroundImage = data.banner ? `url('${data.banner}')` : 'none';
        bannerElem.style.backgroundSize = 'cover';
        bannerElem.style.backgroundPosition = 'center';

        const avatarElem = document.getElementById('modalAvatar');
        avatarElem.src = data.avatar || 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png';

        if (data.tipo) {
          tipoUsuarioAtual = data.tipo;
          atualizarTipo(data.tipo);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar perfil:", err);
        alert("Erro ao carregar perfil. Tente novamente.");
      });
  }

  // Salva o perfil atualizado no backend
  function salvarPerfil() {
    const nome = document.getElementById('inputNome').value.trim();
    const arroba = document.getElementById('inputArroba').value.trim();
    const bio = document.getElementById('inputBio').value;
    const local = document.getElementById('inputLocal').value;
    const aniversario = document.getElementById('inputAniversario').value;
    const avatar = document.getElementById('modalAvatar').src;
    const banner = document.getElementById('modalBanner').style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

    // Validações
    if (!nome || !arroba) {
      alert("Nome e usuário são obrigatórios!");
      return;
    }
    if (nome.length > 30) {
      alert("O nome não pode ter mais que 30 caracteres.");
      return;
    }
    if (arroba.length > 15) {
      alert("O nome de usuário não pode ter mais que 15 caracteres.");
      return;
    }

    const dados = { nome, arroba, bio, local, aniversario, avatar, banner, tipo: tipoUsuarioAtual };
    const btnSalvar = document.getElementById("btnSalvar");
    const textoOriginal = btnSalvar.textContent;
    btnSalvar.textContent = "Salvando...";
    btnSalvar.disabled = true;

    fetch("../backend/perfil.php?action=salvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    })
      .then(async res => {
        const text = await res.text();
        console.warn("⚠️ Resposta bruta do PHP:", text);

        try {
          const data = JSON.parse(text);

          if (data.status === "ok") {
            localStorage.setItem("arroba", arroba);
            alert(data.msg || "Perfil atualizado!");
            atualizarPerfil();
            modal.classList.remove("open");
          } else {
            alert("Erro ao salvar: " + (data.msg || "Erro desconhecido"));
          }
        } catch (e) {
          throw new Error("Resposta inválida do servidor: " + text);
        }
      })
      .catch(err => {
        console.error("Erro ao salvar perfil:", err);
        alert("Ocorreu um erro ao salvar o perfil. Por favor, tente novamente.");
      })
      .finally(() => {
        btnSalvar.textContent = textoOriginal;
        btnSalvar.disabled = false;
      });
  }

  // Atualiza o perfil exibido na página
  function atualizarPerfil() {
    fetch("../backend/perfil.php?action=carregar")
      .then(res => res.json())
      .then(data => {
        const arroba = data.arroba || localStorage.getItem("arroba") || 'seuarroba';
        document.getElementById('nome').textContent = data.nome || 'Seu nome';
        document.getElementById('arroba').textContent = '@' + arroba;
        document.getElementById('arrobaPost').textContent = '@' + arroba;
        document.getElementById('bio').textContent = data.bio || 'Sua bio aqui';
        document.getElementById('local').textContent = data.local || 'Sua cidade';
        document.getElementById('aniversario').textContent = data.aniversario
          ? `Aniversário: ${data.aniversario.split('-').reverse().join('/')}`
          : 'Aniversário: DD/MM/AAAA';

        const avatar = data.avatar || 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png';
        document.getElementById('avatar').src = avatar;
        document.getElementById('modalAvatar').src = avatar;
        document.getElementById("iconHeader").src = avatar;

        const banner = document.getElementById('banner');
        banner.style.backgroundImage = data.banner ? `url('${data.banner}')` : '';
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';

        tipoUsuarioAtual = data.tipo || 'jogador';
        atualizarTipo(tipoUsuarioAtual);
      })
      .catch(err => {
        console.error("Erro ao atualizar perfil:", err);
      });
  }

  // Atualiza o texto e botões com base no tipo do usuário
  function atualizarTipo(tipo) {
    const tipoTexto = document.getElementById('tipoUsuarioTexto');
    const acoes = document.getElementById('acoesTipoUsuario');
    tipoUsuarioAtual = tipo;

    tipoTexto.textContent = `Tipo: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    acoes.innerHTML = '';

    const btnTrocar = document.createElement('button');
    btnTrocar.id = 'alternarTipoBtn';
    btnTrocar.textContent = tipo === 'jogador' ? 'Tornar-se Mestre' : 'Voltar a ser Jogador';
    btnTrocar.onclick = alternarTipoUsuario;
    acoes.appendChild(btnTrocar);

    const btnEntrar = document.createElement('button');
    btnEntrar.textContent = 'Entrar em Party';
    btnEntrar.onclick = () => window.location.href = 'entrar_party.html';
    acoes.appendChild(btnEntrar);

    if (tipo === 'mestre') {
      const btnCriar = document.createElement('button');
      btnCriar.textContent = 'Criar Party';
      btnCriar.onclick = () => window.location.href = 'criar_party.html';
      acoes.appendChild(btnCriar);
    }
  }

  // Alterna o tipo do usuário (jogador <-> mestre)
  function alternarTipoUsuario() {
    if (tipoUsuarioAtual === 'mestre' && !confirm("Deseja voltar a ser Jogador?\n⚠️ Sua party será excluída...")) return;

    tipoUsuarioAtual = tipoUsuarioAtual === 'jogador' ? 'mestre' : 'jogador';
    atualizarTipo(tipoUsuarioAtual);

    const arrobaAtual = document.getElementById("arroba").textContent.replace("@", "");
    const aniversarioTexto = document.getElementById("aniversario").textContent.replace("Aniversário: ", "").trim();
    const aniversarioRevertido = aniversarioTexto.split('/').reverse().join('-');

    fetch("../backend/perfil.php?action=salvar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: document.getElementById("nome").textContent,
        arroba: arrobaAtual,
        bio: document.getElementById("bio").textContent,
        local: document.getElementById("local").textContent,
        aniversario: aniversarioRevertido || "",
        avatar: document.getElementById("avatar").src,
        banner: document.getElementById("banner").style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''),
        tipo: tipoUsuarioAtual
      })
    }).then(() => {
      localStorage.setItem("arroba", arrobaAtual);
      atualizarPerfil();
      modal.classList.remove("open");
    });
  }

  // Eventos para upload de imagem
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

  // Atualiza contador de bio e altura do campo
  document.getElementById('inputBio').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
    document.getElementById('contadorBio').textContent = `${this.value.length} / 160`;
  });

  // Evento para botão salvar
  document.getElementById("btnSalvar").addEventListener("click", salvarPerfil);

  // Carrega os posts do perfil do usuário
  function carregarPostsDoPerfil() {
    fetch("../backend/perfil.php?action=postsUsuario")
      .then(res => res.json())
      .then(posts => {
        const container = document.getElementById("postsPerfil");
        if (!container) return;

        if (!Array.isArray(posts)) {
          console.warn("Resposta inesperada ao carregar posts:", posts);
          return;
        }

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
      })
      .catch(err => {
        console.error("Erro ao carregar posts:", err);
      });
  }

  // Inicializa perfil e posts
  atualizarPerfil();
  carregarPostsDoPerfil();
});
