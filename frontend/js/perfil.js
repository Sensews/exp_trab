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

      // Define a imagem do banner
      if (data.banner) {
        const banner = document.getElementById('modalBanner');
        banner.style.backgroundImage = `url('${data.banner}')`;
        banner.style.backgroundSize = 'cover';
        banner.style.backgroundPosition = 'center';
      }

      // Define o tipo do usuário (jogador ou mestre)
      if (data.tipo) {
        tipoUsuarioAtual = data.tipo;
        atualizarTipo(data.tipo);
      }
    });
}

function salvarPerfil() {
  const nome = document.getElementById('inputNome').value.trim();
  const arroba = document.getElementById('inputArroba').value.trim();
  const bio = document.getElementById('inputBio').value;
  const local = document.getElementById('inputLocal').value;
  const aniversario = document.getElementById('inputAniversario').value;
  const avatar = document.getElementById('modalAvatar').src;
  const banner = document.getElementById('modalBanner').style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

  // Validações básicas
  if (!nome || !arroba) return alert("Nome e usuário são obrigatórios!");
  if (nome.length > 30) return alert("O nome não pode ter mais que 30 caracteres.");
  if (arroba.length > 15) return alert("O nome de usuário não pode ter mais que 15 caracteres.");

  // Prepara os dados
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

  // Envia os dados via POST para o backend
  fetch("../backend/perfil.php?action=salvar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  })
    .then(res => res.json())
    .then(res => {
      if (res.status === "ok") {
        alert("Perfil atualizado!");
        atualizarPerfil();
        modal.classList.remove("open");
      } else {
        alert("Erro ao salvar: " + res.msg);
      }
    });
}


// Atualiza o conteúdo da tela com os dados do perfil do banco
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

// Altera o texto e botão conforme o tipo do usuário
function atualizarTipo(tipo) {
  const tipoTexto = document.getElementById('tipoUsuarioTexto');
  const btnTrocar = document.getElementById('alternarTipoBtn');
  const acoes = document.getElementById('acoesTipoUsuario');

  tipoTexto.textContent = `Tipo: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
  btnTrocar.textContent = tipo === 'jogador' ? 'Tornar-se Mestre' : 'Voltar a ser Jogador';

  // Troca o botão de ação (Criar ou Entrar em Party)
  acoes.innerHTML = '';
  const btn = document.createElement('button');
  btn.textContent = tipo === 'jogador' ? 'Entrar em Party' : 'Criar Party';
  btn.onclick = () => {
    const destino = tipo === 'jogador' ? 'entrar_party.html' : 'criar_party.html';
    window.location.href = destino;
  };
  acoes.appendChild(btn);
}

// Alterna entre jogador e mestre ao clicar no botão
document.getElementById('alternarTipoBtn').addEventListener('click', () => {
  if (tipoUsuarioAtual === 'mestre' && !confirm("Deseja voltar a ser Jogador?\n⚠️ Sua party será excluída...")) return;

  tipoUsuarioAtual = tipoUsuarioAtual === 'jogador' ? 'mestre' : 'jogador';
  atualizarTipo(tipoUsuarioAtual);

  // Salva alteração de tipo no banco
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
  });
});

// Redimensiona imagem antes de salvar (para avatar/banner)
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

// Ao selecionar uma nova imagem de avatar, redimensiona
document.getElementById('inputAvatar').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    resizeAndStoreImage(file, 130, 130, (resizedUrl) => {
      document.getElementById('modalAvatar').src = resizedUrl;
    });
  }
});

// Ao selecionar nova imagem de banner
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

// Atualiza contador de bio dinamicamente
document.getElementById('inputBio').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = this.scrollHeight + 'px';
  document.getElementById('contadorBio').textContent = `${this.value.length} / 160`;
});

// Ao carregar a página, atualiza o perfil e carrega os posts
window.onload = () => {
  atualizarPerfil();
  carregarPostsDoPerfil();
}