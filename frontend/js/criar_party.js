// Executa tudo após o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {

  // Elementos do DOM utilizados
  const select = document.getElementById('escolhaMapa');          
  const btnIrParaParty = document.getElementById('btnIrParty');    
  const form = document.getElementById('formCriarParty');          

  // Variáveis de controle
  let id_perfil = null;         
  let idPartyCriada = null;      

  // Função para carregar os mapas salvos do usuário no select
  async function carregarMapas() {
    select.innerHTML = ''; // Limpa o select antes de adicionar opções

    try {
      const response = await fetch(`../backend/map.php?action=carregar&id_perfil=${id_perfil}`);
      const data = await response.json();

      if (!Array.isArray(data)) throw new Error("Formato inválido");

      // Se não houver mapas salvos
      if (data.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'Você ainda não tem mapas salvos.';
        opt.disabled = true;
        opt.selected = true;
        select.appendChild(opt);
        return;
      }
// Adiciona uma opção padrão ao select
      const optPadrao = document.createElement('option');
      optPadrao.textContent = 'Selecione um mapa...';
      optPadrao.disabled = true;
      optPadrao.selected = true;
      optPadrao.value = '';
      select.appendChild(optPadrao);

      // Adiciona os mapas do usuário no select
      data.forEach(mapa => {
        const opt = document.createElement('option');
        opt.value = mapa.id;
        opt.textContent = mapa.nome || `Mapa #${mapa.id}`;
        select.appendChild(opt);
      });

    } catch (err) {
      // Se der erro na requisição
      console.error("Erro ao carregar mapas:", err);
      const opt = document.createElement('option');
      opt.textContent = 'Erro ao carregar mapas.';
      opt.disabled = true;
      opt.selected = true;
      select.appendChild(opt);
    }
  }
 // Listener para submissão do formulário de criação de party
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita recarregamento da página

    // Coleta os valores dos campos do formulário
    const nome = document.getElementById('nomeParty').value.trim();
    const senha = document.getElementById('senhaParty').value.trim();
    const limite = document.getElementById('limiteParty')?.value ?? 5;
    const mapaId = select.value;

    // Verificação de campos obrigatórios
    if (!nome || !senha || !mapaId) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    // Monta o objeto FormData com os dados do formulário
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('senha', senha);
    formData.append('mapaId', mapaId);
    formData.append('limite', limite);
    formData.append('id_perfil', id_perfil); // Vindo da sessão

    try {
      const response = await fetch('../backend/criar_party.php', {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      let resultado;

      try {
        resultado = JSON.parse(text);
      } catch (err) {
        // Se a resposta não for JSON válido
        console.error('Resposta inválida do servidor:', text);
        alert('Erro: resposta inválida do servidor.');
        return;
      }

      // Se a criação foi bem-sucedida
      if (resultado.sucesso) {
        alert(`Party criada com sucesso!\nCódigo: ${resultado.codigo}\nSenha: ${resultado.senha}`);
        idPartyCriada = resultado.id_party;
        btnIrParaParty.style.display = 'inline-block'; // Mostra o botão de redirecionamento
        btnIrParaParty.dataset.partyId = idPartyCriada;
      } else {
        alert(resultado.erro || 'Erro ao criar a party.');
      }

    } catch (err) {
      // Se houver erro na requisição
      console.error("Erro na requisição:", err);
      alert('Erro na comunicação com o servidor.');
    }
  });
});
