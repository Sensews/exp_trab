// Espera o carregamento do DOM
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Iniciando carregamento da página party...");
  
  // Verifica se a sessão está ativa
  try {
    console.log("Verificando sessão...");
    const res = await fetch("../backend/verificar_sessao.php"); // Faz requisição para verificar sessão
    const dados = await res.json(); // Converte resposta em JSON
    
    console.log("Resposta da sessão:", dados);

    if (!dados.logado) {
      console.log("Usuário não logado, redirecionando...");
      // Redireciona para página de erro se não estiver logado
      window.location.href = "../frontend/erro.html";
      return;
    }

    console.log("Sessão válida, mostrando página...");
    // Mostra o conteúdo da página
    document.body.style.display = "block";
  } catch (e) {
    console.error("Erro na verificação de sessão:", e);
    // Em caso de erro na verificação, redireciona para erro
    window.location.href = "../frontend/erro.html";
    return;
  }

  console.log("Buscando elementos do DOM...");
  
  // Referências aos elementos do DOM
  const nomePartyElem = document.getElementById('nomeParty');
  const tipoUsuarioElem = document.getElementById('tipoUsuario');
  const listaMembrosElem = document.getElementById('listaMembros');
  const chatMensagensElem = document.getElementById('chatMensagens');
  const formChat = document.getElementById('formChat');
  const inputMensagem = document.getElementById('mensagemInput');
  
  // Verificar se todos os elementos existem
  if (!nomePartyElem || !tipoUsuarioElem || !listaMembrosElem || !chatMensagensElem || !formChat || !inputMensagem) {
    console.error("Elementos do DOM não encontrados!");
    console.log("nomeParty:", nomePartyElem);
    console.log("tipoUsuario:", tipoUsuarioElem);
    console.log("listaMembros:", listaMembrosElem);
    console.log("chatMensagens:", chatMensagensElem);
    console.log("formChat:", formChat);
    console.log("inputMensagem:", inputMensagem);
    alert("Erro: Elementos da página não encontrados!");
    return;
  }
  
  console.log("Todos os elementos encontrados, continuando...");
  // Variáveis auxiliares
  let id_party = null;
  let tipo_usuario = null;
  let nome_usuario = null;

  // Obter ID da party da URL
  const urlParams = new URLSearchParams(window.location.search);
  const partyIdFromUrl = urlParams.get('id');

  // Função que carrega dados da party
  async function carregarParty() {
    try {
      let url = '../backend/chat_party.php?action=carregar';
      if (partyIdFromUrl) {
        url += `&id=${partyIdFromUrl}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        alert(data.erro || "Erro ao carregar party.");
        return;
      }

      // Extrai informações
      const party = data.party;
      const membros = data.membros;

      // Salva dados localmente
      id_party = party.id;
      tipo_usuario = party.tipo_usuario;
      nome_usuario = party.nome_usuario;

      // Exibe nome da party e tipo do usuário
      nomePartyElem.textContent = party.nome || "Party";
      tipoUsuarioElem.textContent = `Tipo: ${tipo_usuario}`;

      // Atualiza lista de membros na tela
      atualizarMembros(membros);
    } catch (err) {
      console.error("Erro ao buscar dados da party:", err);
      alert("Erro ao buscar dados da party.");
    }
  }

  // Renderiza os membros na tela
  function atualizarMembros(membros) {
    listaMembrosElem.innerHTML = ''; // Limpa lista atual

    membros.forEach(membro => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.marginBottom = '8px';

      // Avatar do membro
      const img = document.createElement('img');
      img.src = membro.avatar || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png";
      img.alt = membro.arroba;
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.borderRadius = "50%";
      img.style.marginRight = "10px";

      // @arroba do membro
      const span = document.createElement('span');
      span.textContent = `@${membro.arroba}`;

      li.appendChild(img);
      li.appendChild(span);

      // Botão de remover (aparece só para mestres, exceto o próprio)
      if (tipo_usuario === 'mestre' && membro.arroba !== nome_usuario) {
        const btn = document.createElement('button');
        btn.textContent = 'Remover';
        btn.classList.add('btn-remover');
        btn.style.marginLeft = '10px';
        btn.onclick = () => removerMembro(membro.arroba);
        li.appendChild(btn);
      }

      listaMembrosElem.appendChild(li);
    });
  }  // Remove membro da party (usado apenas por mestre)
  async function removerMembro(arroba) {
    const confirmacao = confirm(`Deseja remover @${arroba} da party?`);
    if (!confirmacao) return;

    try {
        let data;
        
        // Construir URL com ID da party se disponível
        let actionUrl = '../backend/chat_party.php?action=remover';
        if (partyIdFromUrl) {
            actionUrl += `&id=${partyIdFromUrl}`;
        }
        
        // Tentar usar criptografia primeiro
        if (window.simpleSecureClient && window.simpleSecureClient.initialized) {
            const memberData = { arroba: arroba };
            data = await window.simpleSecureClient.removeMember(memberData, actionUrl);
        } else {
            // Fallback: método não criptografado
            const res = await fetch(actionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ arroba }) // Envia arroba para backend
            });
            data = await res.json();
        }

        if (data.success) {
            carregarParty(); // Atualiza lista após remoção
        } else {
            alert(data.erro || "Erro ao remover membro.");
        }
    } catch (error) {
        console.error("Erro ao remover membro:", error);
        alert("Erro ao comunicar com o servidor.");
    }
  }
  // Carrega mensagens do chat da party
  async function carregarMensagens() {
    try {
      let url = '../backend/chat_party.php?action=mensagens';
      if (partyIdFromUrl) {
        url += `&id=${partyIdFromUrl}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();

      if (!Array.isArray(data)) {
        console.warn("Resposta inesperada ao carregar mensagens:", data);
        return;
      }

      // Limpa área de mensagens
      chatMensagensElem.innerHTML = '';

      // Cria elementos HTML para cada mensagem
      data.forEach(msg => {
        const div = document.createElement('div');
        div.classList.add("mensagem");

        const linha = document.createElement('div');
        linha.classList.add("linha");

        const autor = document.createElement('span');
        autor.classList.add("autor");
        autor.textContent = `@${msg.arroba || msg.autor || 'Anônimo'}: `;

        const conteudo = document.createElement('span');
        conteudo.classList.add("conteudo");
        conteudo.textContent = msg.mensagem;

        linha.appendChild(autor);
        linha.appendChild(conteudo);

        const hora = document.createElement('div');
        hora.classList.add("hora");
        hora.textContent = new Date(msg.criado_em).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        div.appendChild(linha);
        div.appendChild(hora);
        chatMensagensElem.appendChild(div);
      });

      // Rola o chat automaticamente para o fim
      chatMensagensElem.scrollTop = chatMensagensElem.scrollHeight;

    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
    }
  }
  // Envio de mensagem no formulário do chat
  formChat.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede recarregamento da página
    const texto = inputMensagem.value.trim(); // Pega texto digitado
    if (!texto) return; // Ignora mensagens vazias    try {
        let data;
        
        // Construir URL com ID da party se disponível
        let actionUrl = '../backend/chat_party.php?action=enviar';
        if (partyIdFromUrl) {
            actionUrl += `&id=${partyIdFromUrl}`;
        }
        
        // Tentar usar criptografia primeiro
        if (window.simpleSecureClient && window.simpleSecureClient.initialized) {
            const messageData = { mensagem: texto };
            // Atualizar o método do simpleSecureClient para aceitar URL personalizada
            data = await window.simpleSecureClient.sendChatMessage(messageData, actionUrl);
        } else {
            // Fallback: método não criptografado
            const res = await fetch(actionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensagem: texto }) // Envia mensagem
            });
            data = await res.json();
        }

        if (data.success) {
            inputMensagem.value = ''; // Limpa input
            carregarMensagens(); // Atualiza chat
        } else {
            alert(data.erro || "Erro ao enviar mensagem.");
        }
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        alert("Erro ao enviar a mensagem.");
    }
  });

  // Inicia carregamento inicial da party e das mensagens
  carregarParty();
  carregarMensagens();

  // Atualiza mensagens a cada 5 segundos
  setInterval(carregarMensagens, 5000);
});
