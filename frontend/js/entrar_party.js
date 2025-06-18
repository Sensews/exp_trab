document.addEventListener('DOMContentLoaded', async () => {
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

  const form = document.getElementById('formEntrarParty');
  const codigoInput = document.getElementById('codigo');
  const senhaInput = document.getElementById('senha');
  const mensagemErro = document.getElementById('mensagemErro');

  let id_perfil = null;

  // Buscar perfil do usuário logado
  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      if (!data.id_perfil) {
        mensagemErro.textContent = 'Perfil não encontrado.';
        return;
      }

      id_perfil = data.id_perfil;
    })
    .catch(() => {
      mensagemErro.textContent = 'Erro ao buscar perfil.';
    });

  // Submeter formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensagemErro.textContent = '';

    const codigo = codigoInput.value.trim();
    const senha = senhaInput.value.trim();

    if (!codigo || !senha || !id_perfil) {
      mensagemErro.textContent = 'Preencha todos os campos.';
      return;
    }

    const formData = new FormData();
    formData.append('codigo', codigo);
    formData.append('senha', senha);
    formData.append('id_perfil', id_perfil);

    try {
      const response = await fetch('../backend/entrar_party.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro de resposta do servidor.');
      }

      const result = await response.json();

      if (result.sucesso) {
        // Redireciona para a party com ID retornado
        window.location.href = 'party.html?id=' + result.id_party;
      } else {
        // Mostra erro retornado do backend
        mensagemErro.textContent = result.erro || 'Erro ao entrar na party.';
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      mensagemErro.textContent = 'Erro na comunicação com o servidor.';
    }
  });
});
