document.addEventListener("DOMContentLoaded", function () {
  // Inicializa o Quill
  var quill = new Quill('#editor-container', {
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

  // Salva o conteúdo da nota sempre que for alterado
  quill.on('text-change', function () {
    if (currentProjeto && currentNota) {
      salvarConteudo(currentProjeto, currentNota, quill.root.innerHTML);
    }
  });

  const sidebar = document.getElementById("sidebarProjetos");
  const hamburgerBtn = document.getElementById("hamburgerProjetos");
  const container = document.getElementById("projetosContainer");

  // Recupera os projetos do localStorage 
  let projetos = JSON.parse(localStorage.getItem("oblivionProjetos")) || {};
  let currentProjeto = null;
  let currentNota = null;

  // Abre e fecha a sidebar
  hamburgerBtn.addEventListener("click", () => {
    sidebar.style.transform = sidebar.style.transform === "translateX(0%)"
      ? "translateX(-100%)"
      : "translateX(0%)";
  });

  // Salva a lista de projetos no localStorage
  function salvarProjetos() {
    localStorage.setItem("oblivionProjetos", JSON.stringify(projetos));
  }

  // Atualiza a sidebar com todos os projetos e anotações
  function renderizarSidebar() {
    container.innerHTML = "";

    for (const projeto in projetos) {
      const divProjeto = document.createElement("div");
      divProjeto.classList.add("sidebar-projeto");

      const titulo = document.createElement("div");
      titulo.textContent = "📂 " + projeto;
      titulo.classList.add("titulo-projeto");

      const ul = document.createElement("ul");
      ul.classList.add("lista-notas");

      // Lista de anotações de cada projeto
      projetos[projeto].forEach(nota => {
        const li = document.createElement("li");
        li.classList.add("item-nota");

        const btn = document.createElement("button");
        btn.className = "btn btn-nota";
        btn.textContent = nota;
        btn.onclick = () => abrirNota(projeto, nota);

        li.appendChild(btn);
        ul.appendChild(li);
      });

      // Botão para adicionar nova anotação no projeto
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

  // Cria um novo projeto
  function criarProjeto() {
    const nome = prompt("Nome do novo projeto:");
    if (!nome) return alert("Você precisa digitar um nome.");
    if (projetos[nome]) return alert("Já existe um projeto com esse nome.");

    projetos[nome] = [];
    salvarProjetos();
    renderizarSidebar();

    sidebar.style.transform = "translateX(0%)";
  }

  window.criarProjeto = criarProjeto;

  // Cria uma nova anotação em um projeto
  function criarAnotacao(projeto) {
    const nome = prompt("Nome da nova anotação:");
    if (!nome) return alert("Você precisa digitar um nome.");
    if (projetos[projeto].includes(nome)) return alert("Essa anotação já existe nesse projeto.");

    projetos[projeto].push(nome);
    salvarProjetos();
    salvarConteudo(projeto, nome, "");
    abrirNota(projeto, nome);

    // Fecha a sidebar após criar
    sidebar.style.transform = "translateX(-100%)";

    setTimeout(() => {
      document.getElementById("editor-container").scrollIntoView({ behavior: "smooth", block: "start" });
      quill.focus();
      quill.root.style.boxShadow = "0 0 12px #00ffaa88";
      setTimeout(() => quill.root.style.boxShadow = "none", 1000);
    }, 300);
  }

  // Salva o conteúdo de uma anotação
  function salvarConteudo(projeto, nota, conteudo) {
    localStorage.setItem(`oblivionAnotacoes_${projeto}_${nota}`, conteudo);
  }

  // Abre uma anotação para edição
  function abrirNota(projeto, nota) {
    const conteudo = localStorage.getItem(`oblivionAnotacoes_${projeto}_${nota}`) || "";
    quill.root.innerHTML = conteudo;
    currentProjeto = projeto;
    currentNota = nota;
    renderizarSidebar();
  }

  // Botão para salvar manualmente
  window.salvarAnotacoes = function () {
    if (!currentProjeto || !currentNota) {
      alert("Selecione uma anotação na sidebar.");
      return;
    }
    salvarConteudo(currentProjeto, currentNota, quill.root.innerHTML);
    alert("Anotação salva.");
  };

  // Exportar a anotação
  window.exportarAnotacoes = function () {
    if (!currentNota) return alert("Nenhuma anotação selecionada.");
    const content = quill.root.innerHTML;
    const blob = new Blob([content], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${currentNota}.html`;
    link.click();
  };

  // Limpar a anotação 
  window.limparAnotacoes = function () {
    if (confirm("Deseja apagar a anotação atual?")) {
      quill.root.innerHTML = '';
    }
  };

  // Inicializa a sidebar ao carregar
  renderizarSidebar();
  }
);

