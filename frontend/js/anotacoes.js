// Aguarda o carregamento completo do DOM
document.addEventListener("DOMContentLoaded", () => {
  verificarSessao().then(async (logado) => {
    if (!logado) {
      // Redireciona para a página de erro se a sessão não estiver ativa
      window.location.href = "../frontend/erro.html";
      return;
    }

    // Exibe o corpo da página após verificar a sessão
    document.body.style.display = "block";

    // Inicializa o editor e eventos
    await inicializarEditorEEventos();

    // Carrega os projetos salvos
    await carregarProjetos();
  });
});

// Função para verificar se a sessão do usuário está ativa
async function verificarSessao() {
  try {
    const res = await fetch("../backend/verificar_sessao.php");
    const dados = await res.json();
    return dados.logado === true;
  } catch (e) {
    return false;
  }
}

// Variáveis globais
let currentProjeto = null;
let currentNota = null;
let quill = null;

// Inicializa o editor Quill e eventos da sidebar
async function inicializarEditorEEventos() {
  const sidebar = document.getElementById("sidebarProjetos");
  const hamburgerBtn = document.getElementById("hamburgerProjetos");
  const container = document.getElementById("projetosContainer");

  // Inicializa o editor de texto Quill
  quill = new Quill('#editor-container', {
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
        ['formula'],
        ['clean']
      ]
    }
  });

  // Salva automaticamente o conteúdo sempre que houver alteração
  quill.on('text-change', () => {
    if (!currentProjeto || !currentNota) return;
    fetch("../backend/anotacoes.php?action=salvarConteudo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projeto: currentProjeto,
        titulo: currentNota,
        conteudo: quill.root.innerHTML
      })
    });
  });

  // Evento do botão hamburguer para abrir/fechar sidebar
  hamburgerBtn.addEventListener("click", () => {
    const isOpen = sidebar.style.transform === "translateX(0%)";
    sidebar.style.transform = isOpen ? "translateX(-100%)" : "translateX(0%)";
  });

  // Torna funções acessíveis globalmente via HTML
  window.criarProjeto = criarProjeto;
  window.salvarAnotacoes = salvarAnotacoes;
  window.exportarAnotacoes = exportarAnotacoes;
  window.limparAnotacoes = limparAnotacoes;
  window.excluirAnotacao = excluirAnotacao;
  window.excluirProjeto = excluirProjeto;

  // Função para renderizar todos os projetos e anotações na sidebar
  window.renderizarSidebar = function (projetos) {
    container.innerHTML = "";

    for (const projeto of Object.keys(projetos)) {
      const divProjeto = document.createElement("div");
      divProjeto.classList.add("sidebar-projeto");

      const titulo = document.createElement("div");
      titulo.classList.add("titulo-projeto");
      titulo.innerHTML = `📂 ${projeto} <a class="btn-lixeira" href="#" onclick="event.preventDefault(); excluirProjeto('${projeto}')"></a>`;

      const ul = document.createElement("ul");
      projetos[projeto].forEach(nota => {
        const li = document.createElement("li");
        li.classList.add("item-nota");

        const btn = document.createElement("button");
        btn.className = "btn btn-nota";
        btn.textContent = nota.titulo;
        btn.onclick = () => abrirNota(projeto, nota.titulo);

        const apagar = document.createElement("a");
        apagar.className = "btn-lixeira";
        apagar.href = "#";
        apagar.onclick = (e) => {
          e.preventDefault();
          excluirAnotacao(projeto, nota.titulo);
        };

        li.appendChild(btn);
        li.appendChild(apagar);
        ul.appendChild(li);
      });

      const btnNovaNota = document.createElement("button");
      btnNovaNota.className = "btn btn-nova-nota";
      btnNovaNota.textContent = "➕ Nova Anotação";
      btnNovaNota.onclick = () => criarAnotacao(projeto);

      divProjeto.appendChild(titulo);
      divProjeto.appendChild(ul);
      divProjeto.appendChild(btnNovaNota);
      container.appendChild(divProjeto);
    }
  };
}

// Carrega os projetos do usuário a partir do backend
async function carregarProjetos() {
  const res = await fetch("../backend/anotacoes.php?action=carregarProjetos");
  const dados = await res.json();
  renderizarSidebar(dados);
}

// Cria um novo projeto
async function criarProjeto() {
  const nome = prompt("Nome do novo projeto:");
  if (!nome) return;

  await fetch("../backend/anotacoes.php?action=criarProjeto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome })
  });

  await carregarProjetos();
}

// Cria uma nova anotação dentro de um projeto
async function criarAnotacao(projeto) {
  const titulo = prompt("Nome da nova anotação:");
  if (!titulo) return;

  await fetch("../backend/anotacoes.php?action=criarAnotacao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projeto, titulo })
  });

  await carregarProjetos();
  await abrirNota(projeto, titulo);

  document.getElementById("sidebarProjetos").style.transform = "translateX(-100%)";
}

// Abre uma anotação para edição
async function abrirNota(projeto, titulo) {
  const res = await fetch(`../backend/anotacoes.php?action=carregarConteudo&projeto=${encodeURIComponent(projeto)}&titulo=${encodeURIComponent(titulo)}`);
  const data = await res.json();
  quill.root.innerHTML = data.conteudo || "";
  currentProjeto = projeto;
  currentNota = titulo;
}

// Salva manualmente o conteúdo da anotação
async function salvarAnotacoes() {
  if (!currentProjeto || !currentNota) return alert("Selecione uma anotação.");
  await fetch("../backend/anotacoes.php?action=salvarConteudo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projeto: currentProjeto,
      titulo: currentNota,
      conteudo: quill.root.innerHTML
    })
  });
  alert("Salvo.");
}

// Exporta a anotação atual como arquivo HTML
function exportarAnotacoes() {
  if (!currentNota) return alert("Nenhuma anotação selecionada.");
  const content = quill.root.innerHTML;
  const blob = new Blob([content], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${currentNota}.html`;
  link.click();
}

// Limpa o conteúdo da anotação atual
function limparAnotacoes() {
  if (confirm("Apagar a anotação atual?")) {
    quill.root.innerHTML = '';
  }
}

// Exclui uma anotação específica
async function excluirAnotacao(projeto, titulo) {
  if (!confirm(`Deseja apagar a anotação "${titulo}"?`)) return;

  await fetch("../backend/anotacoes.php?action=excluirAnotacao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projeto, titulo })
  });

  await carregarProjetos();

  if (currentProjeto === projeto && currentNota === titulo) {
    quill.root.innerHTML = "";
    currentNota = null;
  }
}

// Exclui um projeto inteiro com todas as anotações
async function excluirProjeto(projeto) {
  if (!confirm(`Deseja apagar o projeto "${projeto}" com todas as anotações?`)) return;

  await fetch("../backend/anotacoes.php?action=excluirProjeto", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projeto })
  });

  await carregarProjetos();

  if (currentProjeto === projeto) {
    quill.root.innerHTML = "";
    currentNota = null;
    currentProjeto = null;
  }
}
