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

  const btnIrParaParty = document.getElementById('btnIrParty');
  const form = document.getElementById('formCriarParty');
  const resultadoCriacao = document.getElementById('resultadoCriacao');

  let idPartyCriada = null;

  // Função que carrega o perfil com await
  async function carregarPerfil() {
    try {
      const res = await fetch("../backend/perfil.php?action=carregar");
      const data = await res.json();
      if (!data || !data.id_perfil) {
        alert("Perfil não encontrado.");
        return null;
      }
      return data.id_perfil;
    } catch {
      alert("Erro ao buscar perfil.");
      return null;
    }
  }

  // Submissão do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id_perfil = await carregarPerfil();
    if (!id_perfil) return;

    const nome = document.getElementById('nomeParty').value.trim();
    const senha = document.getElementById('senhaParty').value.trim();
    const limite = document.getElementById('limiteParty')?.value ?? 5;

    if (!nome || !senha) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('senha', senha);
    formData.append('limite', limite);
    formData.append('id_perfil', id_perfil);

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
        console.error('Resposta inválida do servidor:', text);
        alert('Erro: resposta inválida do servidor.');
        return;
      }

      if (resultado.sucesso) {
        idPartyCriada = resultado.id_party;
        btnIrParaParty.style.display = 'inline-block';
        btnIrParaParty.dataset.partyId = idPartyCriada;

        // Exibir informações na tela
        resultadoCriacao.innerHTML = `
          <div class="box-result">
            <p><strong>Código da Party:</strong> <span id="codigoGerado">${resultado.codigo}</span></p>
            <p><strong>Senha:</strong> <span id="senhaGerada">${resultado.senha}</span></p>
            <div class="botoes-resultado">
              <button id="btnCopiarDados">📋 Copiar Dados</button>
              <button id="btnExcluirParty" style="background:#cc4444;color:white;">🗑️ Excluir Party</button>
            </div>
          </div>
        `;
        resultadoCriacao.style.display = 'block';

        document.getElementById('btnCopiarDados').addEventListener('click', copiarDados);
        document.getElementById('btnExcluirParty').addEventListener('click', excluirParty);

      } else {
        alert(resultado.erro || 'Erro ao criar a party.');
      }

    } catch (err) {
      console.error("Erro na requisição:", err);
      alert('Erro na comunicação com o servidor.');
    }
  });

  // Redirecionar para party
  btnIrParaParty.addEventListener('click', () => {
    const id = btnIrParaParty.dataset.partyId;
    if (id) {
      window.location.href = `party.html?id=${id}`;
    } else {
      alert("Party ainda não foi criada.");
    }
  });

  // Copiar código e senha
  function copiarDados() {
    const codigo = document.getElementById("codigoGerado").textContent;
    const senha = document.getElementById("senhaGerada").textContent;
    const texto = `Código da Party: ${codigo}\nSenha: ${senha}`;
    navigator.clipboard.writeText(texto)
      .then(() => alert("Informações copiadas!"))
      .catch(() => alert("Erro ao copiar."));
  }

  // Excluir party
  function excluirParty() {
    if (!confirm("Tem certeza que deseja excluir sua party?")) return;

    fetch("../backend/excluir_party.php", { method: "DELETE" })
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          alert("Party excluída com sucesso!");
          location.reload();
        } else {
          alert(data.msg || "Erro ao excluir a party.");
        }
      })
      .catch(err => {
        console.error("Erro ao excluir party:", err);
        alert("Erro ao excluir party.");
      });
  }
});
