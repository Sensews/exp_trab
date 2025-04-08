document.addEventListener("DOMContentLoaded", function () {
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
  
    quill.on('text-change', function () {
      if (currentProjeto && currentNota) {
        salvarConteudo(currentProjeto, currentNota, quill.root.innerHTML);
      }
    });
  
    const sidebar = document.getElementById("sidebarProjetos");
    const hamburgerBtn = document.getElementById("hamburgerProjetos");
    const container = document.getElementById("projetosContainer");
    let projetos = JSON.parse(localStorage.getItem("oblivionProjetos")) || {};
    let currentProjeto = null;
    let currentNota = null;
  
    hamburgerBtn.addEventListener("click", () => {
      sidebar.style.transform = sidebar.style.transform === "translateX(0%)"
        ? "translateX(-100%)"
        : "translateX(0%)";
    });
  
    function salvarProjetos() {
      localStorage.setItem("oblivionProjetos", JSON.stringify(projetos));
    }
  
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
  
    function criarProjeto() {
      const nome = prompt("Nome do novo projeto:");
      if (!nome) return alert("Você precisa digitar um nome.");
      if (projetos[nome]) return alert("Já existe um projeto com esse nome.");
      projetos[nome] = [];
      salvarProjetos();
      renderizarSidebar();
    }
  
    function criarAnotacao(projeto) {
      const nome = prompt("Nome da nova anotação:");
      if (!nome) return alert("Você precisa digitar um nome.");
      if (projetos[projeto].includes(nome)) return alert("Essa anotação já existe nesse projeto.");
      projetos[projeto].push(nome);
      salvarProjetos();
      salvarConteudo(projeto, nome, "");
      abrirNota(projeto, nome);
      sidebar.style.transform = "translateX(-100%)";
      setTimeout(() => {
        document.getElementById("editor-container").scrollIntoView({ behavior: "smooth", block: "start" });
        quill.focus();
        quill.root.style.boxShadow = "0 0 12px #00ffaa88";
        setTimeout(() => quill.root.style.boxShadow = "none", 1000);
      }, 300);
    }
  
    function salvarConteudo(projeto, nota, conteudo) {
      localStorage.setItem(`oblivionAnotacoes_${projeto}_${nota}`, conteudo);
    }
  
    function abrirNota(projeto, nota) {
      const conteudo = localStorage.getItem(`oblivionAnotacoes_${projeto}_${nota}`) || "";
      quill.root.innerHTML = conteudo;
      currentProjeto = projeto;
      currentNota = nota;
      renderizarSidebar();
    }
  
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
  
    renderizarSidebar();
  
    // Dropdown botão "Jogo"
    const dropdownBtn = document.querySelector('.dropdown .btn');
    if (dropdownBtn) {
      dropdownBtn.addEventListener('click', function () {
        document.querySelector('.dropdown-content').classList.toggle('show');
      });
  
      window.addEventListener('click', function (e) {
        if (!e.target.closest('.dropdown')) {
          document.querySelector('.dropdown-content').classList.remove('show');
        }
      });
    }
  });
    // Ao clicar no botão hamburger, alterna a classe "show" no menu mobile
    document.addEventListener("DOMContentLoaded", function () {
      const hamburger = document.querySelector(".hamburger");
      const mobileNav = document.querySelector(".mobile-nav");
  
      hamburger.addEventListener("click", function () {
        mobileNav.classList.toggle("show");
      });
    });