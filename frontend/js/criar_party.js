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
});
