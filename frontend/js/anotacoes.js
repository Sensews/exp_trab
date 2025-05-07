document.addEventListener("DOMContentLoaded", function () {
  const quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ 'font': [] }, { 'size': [] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video', 'formula'],
        ['clean']
      ]
    }
  });

  const sidebar = document.getElementById("sidebarProjetos");
  const hamburgerBtn = document.getElementById("hamburgerProjetos");
  const container = document.getElementById("projetosContainer");

  let projetos = {};
  let currentProjeto = null;
  let currentNota = null;

  hamburgerBtn.addEventListener("click", () => {
    sidebar.style.transform = sidebar.style.transform === "translateX(0%)"
      ? "translateX(-100%)"
      : "translateX(0%)";
  });

  function renderizarSidebar() {
    container.innerHTML = "";

    for (const projeto in projetos) {
      const divProjeto = document.createElement("div");
      divProjeto.classList.add("sidebar-projeto");

      const titulo = document.createElement("div");
      titulo.textContent = "📂 " + projeto;
      titulo.classList.add("titulo-projeto");

      const btnExcluirProjeto = document.createElement("button");
      btnExcluirProjeto.textContent = "🗑️";
      btnExcluirProjeto.className = "btn btn-excluir";
      btnExcluirProjeto.onclick = () => excluirProjeto(projeto);

      const btnVerVersoes = document.createElement("button");
      btnVerVersoes.textContent = "↩️ Ver versões";
      btnVerVersoes.className = "btn btn-versoes";
      btnVerVersoes.onclick = () => verVersoes(projeto, currentNota || '');

      titulo.appendChild(btnExcluirProjeto);
      titulo.appendChild(btnVerVersoes);

      const ul = document.createElement("ul");
      ul.classList.add("lista-notas");

      projetos[projeto].forEach(nota => {
        const li = document.createElement("li");
        li.classList.add("item-nota");

        const btn = document.createElement("button");
        btn.className = "btn btn-nota";
        btn.textContent = nota;
        btn.onclick = () => abrirNota(projeto, nota);

        const excluirBtn = document.createElement("button");
        excluirBtn.textContent = "🗑️";
        excluirBtn.className = "btn btn-excluir-nota";
        excluirBtn.onclick = (e) => {
          e.stopPropagation();
          excluirNota(projeto, nota);
        };

        li.appendChild(btn);
        li.appendChild(excluirBtn);
        ul.appendChild(li);
      });

      const btnNovaNota = document.createElement("button");
      btnNovaNota.textContent = "➕ Nova Anotação";
      btnNovaNota.className = "btn btn-nova-nota";
      btnNovaNota.onclick = () => criarAnotacao(projeto);

      divProjeto.appendChild(titulo);
      divProjeto.appendChild(ul);
      divProjeto.appendChild(btnNovaNota);
      container.appendChild(divProjeto);
    }
  }

  function carregarProjetos() {
    fetch("backend/anotacoes_backend.php?action=listar")
      .then(r => r.json())
      .then(data => {
        projetos = data;
        renderizarSidebar();
      });
  }

  function criarProjeto() {
    const nome = prompt("Nome do novo projeto:");
    if (!nome) return alert("Você precisa digitar um nome.");
    fetch("backend/anotacoes_backend.php?action=criar_projeto", {
      method: "POST",
      body: new URLSearchParams({ nome })
    }).then(() => carregarProjetos());
  }

  function criarAnotacao(projeto) {
    const nome = prompt("Nome da nova anotação:");
    if (!nome) return alert("Você precisa digitar um nome.");

    fetch("backend/anotacoes_backend.php?action=criar_nota", {
      method: "POST",
      body: new URLSearchParams({ projeto, nota: nome })
    }).then(() => {
      abrirNota(projeto, nome);
      setTimeout(() => {
        quill.focus();
        quill.root.style.boxShadow = "0 0 12px #00ffaa88";
        setTimeout(() => quill.root.style.boxShadow = "none", 1000);
      }, 300);
      carregarProjetos();
    });
  }

  function salvarConteudo(projeto, nota, conteudo) {
    fetch("backend/anotacoes_backend.php?action=salvar_nota", {
      method: "POST",
      body: new URLSearchParams({ projeto, nota, conteudo })
    });
  }

  function abrirNota(projeto, nota) {
    fetch(`backend/anotacoes_backend.php?action=carregar_nota&projeto=${encodeURIComponent(projeto)}&nota=${encodeURIComponent(nota)}`)
      .then(r => r.text())
      .then(conteudo => {
        quill.root.innerHTML = conteudo;
        currentProjeto = projeto;
        currentNota = nota;
      });
  }

  quill.on('text-change', function () {
    if (currentProjeto && currentNota) {
      salvarConteudo(currentProjeto, currentNota, quill.root.innerHTML);
    }
  });

  window.salvarAnotacoes = function () {
    if (!currentProjeto || !currentNota) {
      alert("Selecione uma anotação na sidebar.");
      return;
    }
    salvarConteudo(currentProjeto, currentNota, quill.root.innerHTML);
    alert("Anotação salva.");
  };

  window.exportarAnotacoes = function () {
    if (!currentNota) return alert("Nenhuma anotação selecionada.");
    const content = quill.root.innerHTML;
    const blob = new Blob([content], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentNota}.html`;
    link.click();
  };

  window.limparAnotacoes = function () {
    if (confirm("Deseja apagar a anotação atual?")) {
      quill.root.innerHTML = '';
    }
  };

  window.criarProjeto = criarProjeto;

  function excluirNota(projeto, nota) {
    if (!confirm(`Excluir anotação "${nota}" do projeto "${projeto}"?`)) return;
    fetch("backend/anotacoes_backend.php?action=excluir_nota", {
      method: "POST",
      body: new URLSearchParams({ projeto, nota })
    }).then(() => carregarProjetos());
  }

  function excluirProjeto(projeto) {
    if (!confirm(`Excluir projeto "${projeto}" e todas suas anotações?`)) return;
    fetch("backend/anotacoes_backend.php?action=excluir_projeto", {
      method: "POST",
      body: new URLSearchParams({ projeto })
    }).then(() => {
      currentProjeto = null;
      currentNota = null;
      quill.root.innerHTML = "";
      carregarProjetos();
    });
  }

  function verVersoes(projeto, nota) {
    if (!projeto || !nota) return alert("Selecione uma anotação.");

    fetch(`backend/anotacoes_backend.php?action=backup_versoes&projeto=${encodeURIComponent(projeto)}&nota=${encodeURIComponent(nota)}`)
      .then(r => r.json())
      .then(versoes => {
        if (versoes.length === 0) return alert("Nenhuma versão antiga encontrada.");

        const modal = document.createElement("div");
        modal.className = "modal-backup";
        modal.innerHTML = `
          <div class="modal-content">
            <h3>🕒 Versões antigas de "${nota}"</h3>
            <ul>${versoes.map(v => `
              <li>
                <small>${new Date(v.salvo_em).toLocaleString()}</small>
                <button class="btn" onclick='restaurarVersao(${JSON.stringify(JSON.stringify(v.conteudo))})'>Restaurar</button>
              </li>`).join('')}
            </ul>
            <button class="btn" onclick="this.parentElement.parentElement.remove()">Fechar</button>
          </div>`;
        document.body.appendChild(modal);
      });
  }

  window.restaurarVersao = function (conteudo) {
    conteudo = JSON.parse(conteudo);
    quill.root.innerHTML = conteudo;
    salvarConteudo(currentProjeto, currentNota, conteudo);
    alert("Versão restaurada.");
  };

  carregarProjetos();
});
