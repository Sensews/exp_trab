// Executa tudo após o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {

  // Elementos do DOM utilizados
  const select = document.getElementById('escolhaMapa');         
  const btnIrParaParty = document.getElementById('btnIrParty');  
  const form = document.getElementById('formCriarParty');         

  // Variáveis de controle
  let id_perfil = null;         
  let idPartyCriada = null;    

  // Função para carregar os mapas do usuário no <select>
  async function carregarMapas() {
    select.innerHTML = '';

    try {
      // Envia requisição POST para buscar os mapas do perfil
      const response = await fetch(`../backend/map.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "carregar", id_perfil: id_perfil })
      });

      const data = await response.json();

      // Garante que o retorno seja um array de mapas
      if (!Array.isArray(data)) throw new Error("Formato inválido");

      // Se o usuário não tiver nenhum mapa salvo
      if (data.length === 0) {
        const opt = document.createElement('option');
        opt.textContent = 'Você ainda não tem mapas salvos.';
        opt.disabled = true;
        opt.selected = true;
        select.appendChild(opt);
        return;
      }

      // Opção padrão
      const optPadrao = document.createElement('option');
      optPadrao.textContent = 'Selecione um mapa...';
      optPadrao.disabled = true;
      optPadrao.selected = true;
      optPadrao.value = '';
      select.appendChild(optPadrao);

      // Adiciona os mapas ao <select>
      data.forEach(mapa => {
        const opt = document.createElement('option');
        opt.value = mapa.id;
        opt.textContent = mapa.nome || `Mapa #${mapa.id}`;
        select.appendChild(opt);
      });

    } catch (err) {
      // Caso haja erro na requisição
      console.error("Erro ao carregar mapas:", err);
      const opt = document.createElement('option');
      opt.textContent = 'Erro ao carregar mapas.';
      opt.disabled = true;
      opt.selected = true;
      select.appendChild(opt);
    }
  }

  // Evento de submissão do formulário de criação da party
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita recarregamento da página

    // Coleta os dados dos campos do formulário
    const nome = document.getElementById('nomeParty').value.trim();
    const senha = document.getElementById('senhaParty').value.trim();
    const limite = document.getElementById('limiteParty')?.value ?? 5;
    const mapaId = select.value;

    // Validação básica
    if (!nome || !senha || !mapaId) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    // Monta o FormData com os dados para enviar via POST
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('senha', senha);
    formData.append('mapaId', mapaId);
    formData.append('limite', limite);
    formData.append('id_perfil', id_perfil);

    try {
      // Envia a requisição para criar a party
      const response = await fetch('../backend/criar_party.php', {
        method: 'POST',
        body: formData
      });

      const text = await response.text();
      let resultado;

      // Tenta converter para JSON
      try {
        resultado = JSON.parse(text);
      } catch (err) {
        console.error('Resposta inválida do servidor:', text);
        alert('Erro: resposta inválida do servidor.');
        return;
      }

      // Se a criação for bem-sucedida
      if (resultado.sucesso) {
        alert(`Party criada com sucesso!\nCódigo: ${resultado.codigo}\nSenha: ${resultado.senha}`);
        idPartyCriada = resultado.id_party;
        btnIrParaParty.style.display = 'inline-block'; // Mostra botão de redirecionar
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

  // Evento de clique no botão "Ir para a party"
  btnIrParaParty.addEventListener('click', () => {
    const id = btnIrParaParty.dataset.partyId;
    if (id) {
      window.location.href = `party.html?id=${id}`;
    } else {
      alert("Party ainda não foi criada.");
    }
  });

  // Ao carregar a página, busca o perfil do usuário logado
  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      if (!data.id_perfil) {
        alert("Perfil não encontrado.");
        return;
      }

      id_perfil = data.id_perfil; // Define o ID do perfil
      carregarMapas(); // E carrega os mapas do perfil
    })
    .catch(() => {
      alert("Erro ao buscar perfil.");
    });
});
