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