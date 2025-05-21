// Executa o código quando a página estiver carregada
document.addEventListener('DOMContentLoaded', () => {
  
  // Primeiro, faz uma requisição para obter os dados do perfil logado
  fetch("../backend/perfil.php?action=carregar")
    .then(res => res.json())
    .then(data => {

      // Se não encontrar o perfil, mostra mensagem de erro
      if (!data.id_perfil) {
        document.getElementById('infoParty').innerHTML = `<p>Perfil não encontrado.</p>`;
        return;
      }

      // Cria objeto FormData com o id_perfil para enviar via POST
      const formData = new FormData();
      formData.append("id_perfil", data.id_perfil);

      // Envia requisição para carregar dados da party em que o usuário é mestre
      fetch("backend/carregar_party.php", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {

          // Se a party não for encontrada ou erro, mostra a mensagem
          if (!data.success) {
            document.getElementById('infoParty').innerHTML = `<p>${data.erro}</p>`;
            return;
          }

          // Party e membros retornados com sucesso
          const party = data.party;
          const membros = data.membros;

          // Preenche os dados da party na interface
          document.getElementById('nomeParty').textContent = party.nome;
          document.getElementById('codigoParty').textContent = party.codigo;
          document.getElementById('senhaParty').textContent = party.senha;
          document.getElementById('limiteParty').textContent = `${party.limite_jogadores} jogadores`;
          document.getElementById('mapaParty').textContent = party.nome_mapa || 'Criado do zero';

          // Lista os membros da party
          const lista = document.getElementById('listaMembros');
          lista.innerHTML = '';

          membros.forEach(m => {
            const li = document.createElement('li');
            li.textContent = `${m.nome} (${m.status})`;
            lista.appendChild(li);
          });
        })

        // Caso haja erro ao buscar os dados da party (ex: servidor offline)
        .catch(err => {
          console.error("Erro ao carregar party:", err);
          document.getElementById('infoParty').innerHTML = `<p>Erro ao carregar dados da party.</p>`;
        });
    })

    // Caso haja erro ao carregar os dados do perfil
    .catch(() => {
      document.getElementById('infoParty').innerHTML = `<p>Erro ao buscar perfil.</p>`;
    });
});
