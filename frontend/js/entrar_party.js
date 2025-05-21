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

// Carrega as fichas do perfil para o <select>
  async function carregarFichas() {
    try {
      const res = await fetch(`../backend/ficha.php?action=listar&id_perfil=${id_perfil}`);
      const fichas = await res.json();

      fichaSelect.innerHTML = '';

      if (fichas.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'Nenhuma ficha encontrada.';
        opt.disabled = true;
        opt.selected = true;
        fichaSelect.appendChild(opt);
        return;
      }

      const optPadrao = document.createElement('option');
      optPadrao.textContent = 'Selecione sua ficha...';
      optPadrao.disabled = true;
      optPadrao.selected = true;
      fichaSelect.appendChild(optPadrao);

      // Adiciona as fichas como opções
      fichas.forEach(ficha => {
        const opt = document.createElement('option');
        opt.value = ficha.id;
        opt.textContent = ficha.nome;
        fichaSelect.appendChild(opt);
      });

    } catch (err) {
      console.error("Erro ao carregar fichas:", err);
      const opt = document.createElement('option');
      opt.textContent = 'Erro ao carregar fichas.';
      opt.disabled = true;
      opt.selected = true;
      fichaSelect.appendChild(opt);
    }
  }

// Envia os dados do formulário para tentar entrar na party
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensagemErro.textContent = ''; // Limpa erro anterior

    const codigo = codigoInput.value.trim();
    const senha = senhaInput.value.trim();
    const fichaId = fichaSelect.value;

    // Validação básica
    if (!codigo || !senha || !fichaId || !id_perfil) {
      mensagemErro.textContent = 'Preencha todos os campos.';
      return;
    }

    const formData = new FormData();
    formData.append('codigo', codigo);
    formData.append('senha', senha);
    formData.append('id_ficha', fichaId);
    formData.append('id_perfil', id_perfil);

    try {
      const response = await fetch('../backend/entrar_party.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.sucesso) {
        // Redireciona para a página da party
        window.location.href = 'party.html';
      } else {
        // Mostra erro retornado pelo servidor
        mensagemErro.textContent = result.erro || 'Erro ao entrar na party.';
      }
    } catch (error) {
      console.error('Erro:', error);
      mensagemErro.textContent = 'Erro na comunicação com o servidor.';
    }
  });
});  