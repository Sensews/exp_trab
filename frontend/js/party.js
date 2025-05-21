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

// Exibe ficha (ou botão para criar)
  const conteudoFicha = document.getElementById('conteudoFicha');
  const fichaSalva = localStorage.getItem('fichaJogador');

  if (conteudoFicha) {
    if (fichaSalva) {
      conteudoFicha.innerHTML = fichaSalva;
    } else {
      conteudoFicha.innerHTML = `
        Nenhuma ficha criada ainda.
        <br><br>
        <button id="criarFichaBtn">Criar Ficha</button>
      `;
      document.getElementById('criarFichaBtn').addEventListener('click', () => {
        window.location.href = 'fichas.html';
      });
    }
  }

  // Exibe blocos separados para mestre e jogador
  const areaMestre = document.querySelector('.area-mestre');
  const areaJogador = document.querySelector('.area-jogador');

  if (tipoUsuario.toLowerCase() === 'mestre') {
    if (areaMestre) areaMestre.style.display = 'block';
    if (areaJogador) areaJogador.style.display = 'none';  
});
