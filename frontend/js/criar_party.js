// Executa tudo após o carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {

  // Elementos do DOM utilizados
  const select = document.getElementById('escolhaMapa');           // Select de mapas
  const btnIrParaParty = document.getElementById('btnIrParty');    // Botão para ir para a party criada
  const form = document.getElementById('formCriarParty');          // Formulário de criação de party

  // Variáveis de controle
  let id_perfil = null;           // ID do perfil do usuário (será carregado dinamicamente)
  let idPartyCriada = null;       // Armazena o ID da party após criação

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
    }
});
