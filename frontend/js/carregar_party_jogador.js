// Executa quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', () => {
  // Primeiro, carrega os dados do perfil logado
  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {
      // Se não encontrar o perfil, exibe mensagem de erro
      if (!data.id_perfil) {
        document.getElementById('infoParty').innerHTML = `<p>Perfil não encontrado.</p>`;
        return;
      }

      // Cria formData para enviar o id_perfil via POST
      const formData = new FormData();
      formData.append("id_perfil", data.id_perfil);

      // Busca a party onde o jogador está
      fetch("../backend/carregar_party_jogador.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          // Se houver erro ao buscar party, exibe erro
          if (!data.success) {
            document.getElementById('infoParty').innerHTML = `<p>${data.erro}</p>`;
            return;
          }

          // Dados da party e membros retornados com sucesso
          const party = data.party;
          const membros = data.membros;

          // Preenche os elementos HTML com as informações da party
          document.getElementById('nomeParty').textContent = party.nome;
          document.getElementById('codigoParty').textContent = party.codigo;
          document.getElementById('senhaParty').textContent = party.senha;
          document.getElementById('mapaParty').textContent = party.nome_mapa || 'Mapa não definido';
          document.getElementById('mestreParty').textContent = party.nome_mestre || 'Desconhecido';
          document.getElementById('limiteParty').textContent = `${party.limite_jogadores} jogadores`;

          // Lista os membros da party
          const lista = document.getElementById('listaMembros');
          lista.innerHTML = '';

          membros.forEach(m => {
            const li = document.createElement('li');
            li.textContent = `${m.nome} (${m.status})`;
            lista.appendChild(li);
          });
        })
        .catch(err => {
          // Erro ao tentar buscar os dados da party
          console.error("Erro ao carregar party:", err);
          document.getElementById('infoParty').innerHTML = `<p>Erro ao carregar dados da party.</p>`;
        });
    })
    .catch(() => {
      // Erro ao tentar buscar o perfil
      document.getElementById('infoParty').innerHTML = `<p>Erro ao buscar perfil.</p>`;
    });
});
