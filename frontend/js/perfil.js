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

