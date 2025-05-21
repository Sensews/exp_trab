document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formEntrarParty');
  const codigoInput = document.getElementById('codigo');
  const senhaInput = document.getElementById('senha');
  const fichaSelect = document.getElementById('fichaSelect');
  const mensagemErro = document.getElementById('mensagemErro');

  let id_perfil = null; 

  // Busca o perfil logado dinamicamente
  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      if (!data.id_perfil) {
        mensagemErro.textContent = 'ID do perfil não encontrado.';
        return;
      }

      id_perfil = data.id_perfil;
      carregarFichas(); // Só carrega as fichas depois de ter o perfil
    })
    .catch(() => {
      mensagemErro.textContent = 'Erro ao carregar perfil.';
    });
});