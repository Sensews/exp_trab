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

    // Exemplo: simulação de fichas dos jogadores
    const container = document.createElement('div');
    container.id = 'fichasTodosJogadores';
    container.style.marginTop = '20px';

    const titulo = document.createElement('h3');
    titulo.textContent = 'Fichas da Party';
    container.appendChild(titulo);

    const jogadores = ['@elfo_ladino', '@guerreiro_op', '@curandeiro'];
    jogadores.forEach(nick => {
      const bloco = document.createElement('div');
      bloco.style.border = '1px solid #00ffaa55';
      bloco.style.margin = '8px 0';
      bloco.style.padding = '8px';
      bloco.innerHTML = `<strong>${nick}</strong><br>Ficha do personagem (dados simulados)`;
      container.appendChild(bloco);
    });

    const localFicha = document.getElementById('fichaJogador');
    if (localFicha) localFicha.appendChild(container);

  } else {
    if (areaJogador) areaJogador.style.display = 'block';
    if (areaMestre) areaMestre.style.display = 'none';
  }

  // Função para enviar mensagem do chat COM CRIPTOGRAFIA
  function enviarMensagemChat(mensagem) {
    const dados = {
      action: 'enviarMensagem',
      mensagem: mensagem,
      party_id: localStorage.getItem('party_id') || null
    };

    window.secureFetch.securePost('../backend/party-chat-seguro.php', dados)
      .then(response => {
        if (response.success) {
          // Adiciona mensagem ao chat local
          adicionarMensagemChat(response.mensagem);
        } else {
          console.error('Erro ao enviar mensagem:', response.error);
        }
      })
      .catch(error => {
        console.error('Erro na comunicação segura do chat:', error);
      });
  }

  // Função para carregar mensagens do chat COM CRIPTOGRAFIA
  function carregarMensagensChat() {
    const dados = {
      action: 'carregarMensagens',
      party_id: localStorage.getItem('party_id') || null
    };

    window.secureFetch.securePost('../backend/party-chat-seguro.php', dados)
      .then(response => {
        if (response.success) {
          const chatContainer = document.getElementById('chatMensagens');
          if (chatContainer) {
            chatContainer.innerHTML = '';
            response.mensagens.forEach(msg => {
              adicionarMensagemChat(msg);
            });
          }
        }
      })
      .catch(error => {
        console.error('Erro ao carregar mensagens:', error);
      });
  }

  // Função para adicionar mensagem ao chat
  function adicionarMensagemChat(mensagem) {
    const chatContainer = document.getElementById('chatMensagens');
    if (!chatContainer) return;

    const msgElement = document.createElement('div');
    msgElement.className = 'mensagem-chat';
    msgElement.innerHTML = `
      <span class="autor-mensagem">${mensagem.autor}:</span>
      <span class="texto-mensagem">${mensagem.texto}</span>
      <span class="hora-mensagem">${mensagem.hora}</span>
    `;
    
    chatContainer.appendChild(msgElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Event listener para envio de mensagem
  const chatInput = document.getElementById('chatInput');
  const btnEnviarChat = document.getElementById('btnEnviarChat');

  if (btnEnviarChat && chatInput) {
    btnEnviarChat.addEventListener('click', () => {
      const mensagem = chatInput.value.trim();
      if (mensagem) {
        enviarMensagemChat(mensagem);
        chatInput.value = '';
      }
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const mensagem = chatInput.value.trim();
        if (mensagem) {
          enviarMensagemChat(mensagem);
          chatInput.value = '';
        }
      }
    });
  }

  // Carrega mensagens ao inicializar
  carregarMensagensChat();

  // Atualiza mensagens a cada 5 segundos
  setInterval(carregarMensagensChat, 5000);
});
