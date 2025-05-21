document.addEventListener('DOMContentLoaded', () => {
  // Define nome da party
  const nomeParty = localStorage.getItem('nomeParty') || 'Nome da Party';
  document.getElementById('nomeParty').textContent = nomeParty;

  // Define tipo de usuário
  const tipoUsuario = localStorage.getItem('tipoUsuario') || 'Jogador';
  document.getElementById('tipoUsuario').textContent = `Tipo: ${tipoUsuario}`;

  // Atualiza avatar do header (se existir)
  const avatar = localStorage.getItem('avatar');
  if (avatar) {
    const icon = document.getElementById('iconHeader');
    if (icon) icon.src = avatar;
  }

  // Exibe mapa se existir
  const mapaAtual = localStorage.getItem('mapaAtual');
  if (mapaAtual) {
    const mapaView = document.getElementById('mapaView');
    if (mapaView) {
      mapaView.style.backgroundImage = `url('${mapaAtual}')`;
      mapaView.style.backgroundSize = 'cover';
      mapaView.style.backgroundPosition = 'center';
    }
  }
});
