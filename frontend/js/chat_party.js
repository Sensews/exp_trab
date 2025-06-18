// Sistema de chat da party com criptografia híbrida
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Iniciando sistema de party...");
  
  // Verificar sessão
  try {
    console.log("Verificando sessão...");
    const sessaoRes = await fetch("../backend/verificar_sessao.php");
    const sessaoData = await sessaoRes.json();
    
    if (!sessaoData.logado) {
      console.log("Usuário não logado");
      window.location.href = "../frontend/erro.html";
      return;
    }
    
    console.log("Sessão válida, mostrando página...");
    document.body.style.display = "block";
  } catch (error) {
    console.error("Erro na verificação de sessão:", error);
    window.location.href = "../frontend/erro.html";
    return;
  }

  // Elementos DOM
  const nomePartyElem = document.getElementById('nomeParty');
  const tipoUsuarioElem = document.getElementById('tipoUsuario');
  const listaMembrosElem = document.getElementById('listaMembros');
  const chatMensagensElem = document.getElementById('chatMensagens');
  const formChat = document.getElementById('formChat');
  const inputMensagem = document.getElementById('mensagemInput');

  // Verificar se elementos existem
  if (!nomePartyElem || !tipoUsuarioElem || !listaMembrosElem || !chatMensagensElem || !formChat || !inputMensagem) {
    console.error("Elementos DOM não encontrados!");
    alert("Erro: Elementos da página não encontrados!");
    return;
  }
  console.log("Elementos DOM encontrados");
  // Aguardar inicialização da criptografia
  console.log("Aguardando inicialização da criptografia...");
  if (window.simpleSecureClient) {
    await window.simpleSecureClient.initialize();
    console.log("Criptografia inicializada:", window.simpleSecureClient.initialized);
  } else {
    console.warn("SimpleSecureClient não encontrado - funcionará sem criptografia");
  }

  // Variáveis globais
  let currentParty = null;
  let refreshInterval = null;

  // Obter ID da party da URL
  const urlParams = new URLSearchParams(window.location.search);
  const partyIdFromUrl = urlParams.get('id');

  // Carregar dados da party
  async function carregarParty() {
    try {
      console.log("Carregando dados da party...");
      
      let url = '../backend/chat_party.php?action=carregar';
      if (partyIdFromUrl) {
        url += `&id=${partyIdFromUrl}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        console.error("Erro ao carregar party:", data.erro);
        alert(data.erro || "Erro ao carregar party.");
        return false;
      }

      // Salvar dados da party
      currentParty = data.party;
      
      // Atualizar interface
      nomePartyElem.textContent = currentParty.nome || "Party";
      tipoUsuarioElem.textContent = `Tipo: ${currentParty.tipo_usuario}`;

      // Atualizar membros
      atualizarMembros(data.membros);
      
      console.log("Party carregada:", currentParty);
      return true;
    } catch (error) {
      console.error("Erro ao carregar party:", error);
      alert("Erro ao carregar dados da party.");
      return false;
    }
  }

  // Atualizar lista de membros
  function atualizarMembros(membros) {
    listaMembrosElem.innerHTML = '';
    
    membros.forEach(membro => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.marginBottom = '8px';

      const img = document.createElement('img');
      img.src = membro.avatar || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
      img.alt = membro.arroba;
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.borderRadius = "50%";
      img.style.marginRight = "10px";

      const span = document.createElement('span');
      span.textContent = `@${membro.arroba}`;

      li.appendChild(img);
      li.appendChild(span);

      // Botão de remover (só para mestres)
      if (currentParty && currentParty.tipo_usuario === 'mestre' && membro.arroba !== currentParty.nome_usuario) {
        const btnRemover = document.createElement('button');
        btnRemover.textContent = '×';
        btnRemover.style.marginLeft = 'auto';
        btnRemover.style.background = '#dc3545';
        btnRemover.style.color = 'white';
        btnRemover.style.border = 'none';
        btnRemover.style.borderRadius = '50%';
        btnRemover.style.width = '20px';
        btnRemover.style.height = '20px';
        btnRemover.style.cursor = 'pointer';
        btnRemover.title = 'Remover membro';
        
        btnRemover.addEventListener('click', () => removerMembro(membro.arroba));
        li.appendChild(btnRemover);
      }

      listaMembrosElem.appendChild(li);
    });
  }

  // Carregar mensagens do chat
  async function carregarMensagens() {
    try {
      let url = '../backend/chat_party.php?action=mensagens';
      if (partyIdFromUrl) {
        url += `&id=${partyIdFromUrl}`;
      }
      
      const response = await fetch(url);
      const mensagens = await response.json();

      chatMensagensElem.innerHTML = '';

      if (Array.isArray(mensagens)) {
        mensagens.forEach(msg => {
          const div = document.createElement('div');
          div.className = 'mensagem';
          div.innerHTML = `
            <div class="mensagem-header">
              <strong>@${msg.arroba}</strong>
              <span class="mensagem-tempo">${new Date(msg.criado_em).toLocaleTimeString()}</span>
            </div>
            <div class="mensagem-conteudo">${msg.mensagem}</div>
          `;
          chatMensagensElem.appendChild(div);
        });
        
        // Scroll para o final
        chatMensagensElem.scrollTop = chatMensagensElem.scrollHeight;
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  }  // Enviar mensagem
  async function enviarMensagem(mensagem) {
    try {
      console.log("=== ENVIANDO MENSAGEM ===");
      console.log("Mensagem:", mensagem);
      console.log("SimpleSecureClient disponível:", !!window.simpleSecureClient);
      console.log("SimpleSecureClient inicializado:", window.simpleSecureClient?.initialized);
      
      let url = '../backend/chat_party.php?action=enviar';
      if (partyIdFromUrl) {
        url += `&id=${partyIdFromUrl}`;
      }
      console.log("URL:", url);
        // Usar criptografia híbrida se disponível
      if (window.simpleSecureClient && window.simpleSecureClient.initialized) {
        console.log("Usando criptografia híbrida");
        const messageData = { mensagem };
        console.log("Dados a serem criptografados:", messageData);
        
        // Criptografar manualmente
        const encryptedData = window.simpleSecureClient.encrypt(messageData);
        console.log("Dados criptografados:", encryptedData);
        
        const requestBody = {
          encrypted_data: encryptedData
        };
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log("Resultado da criptografia:", result);
        
        if (result.success) {
          inputMensagem.value = '';
          carregarMensagens(); // Recarregar mensagens
        } else {
          console.error("Erro no resultado:", result);
          alert(result.erro || 'Erro ao enviar mensagem');
        }
      } else {
        console.log("Fallback: enviando sem criptografia");
        // Fallback sem criptografia
        const requestData = { mensagem };
        console.log("Dados fallback:", requestData);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });

        const result = await response.json();
        console.log("Resultado fallback:", result);

        if (result.success) {
          inputMensagem.value = '';
          carregarMensagens(); // Recarregar mensagens
        } else {
          alert(result.erro || 'Erro ao enviar mensagem');
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem: " + error.message);
    }
  }

  // Remover membro
  async function removerMembro(arroba) {
    if (!confirm(`Deseja remover @${arroba} da party?`)) return;

    try {
      // Preparar dados para criptografia
      const dataToEncrypt = { arroba };
      
      // Criptografar usando a biblioteca de criptografia
      let requestBody;
      if (typeof window.SimpleSecureClient !== 'undefined') {
        requestBody = JSON.stringify({
          encrypted_data: await window.SimpleSecureClient.encrypt(JSON.stringify(dataToEncrypt))
        });
      } else {
        // Fallback sem criptografia
        requestBody = JSON.stringify(dataToEncrypt);
      }

      let url = '../backend/chat_party.php?action=remover';
      if (partyIdFromUrl) {
        url += `&id=${partyIdFromUrl}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      const result = await response.json();

      if (result.success) {
        alert('Membro removido com sucesso!');
        carregarParty(); // Recarregar dados da party
      } else {
        alert(result.erro || 'Erro ao remover membro');
      }
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      alert("Erro ao remover membro: " + error.message);
    }
  }

  // Event listener para o formulário de chat
  formChat.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const mensagem = inputMensagem.value.trim();
    if (mensagem) {
      enviarMensagem(mensagem);
    }
  });

  // Inicialização
  async function inicializar() {
    console.log("Inicializando sistema...");
    
    const partyCarregada = await carregarParty();
    if (partyCarregada) {
      await carregarMensagens();
      
      // Atualizar mensagens a cada 3 segundos
      refreshInterval = setInterval(carregarMensagens, 3000);
      
      console.log("Sistema inicializado com sucesso!");
    } else {
      console.error("Falha ao inicializar sistema");
    }
  }

  // Cleanup ao sair da página
  window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  // Inicializar o sistema
  inicializar();
});
