document.addEventListener("DOMContentLoaded", () => {
  // Elementos principais da página
  const sidebar = document.getElementById("sidebarProjetos");
  const hamburgerBtn = document.getElementById("hamburgerProjetos");
  const container = document.getElementById("projetosContainer");

  // Estado atual
  let currentProjeto = null;
  let currentNota = null;
  let quill;

  // Inicializa o editor Quill
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

  // Salva automaticamente ao digitar
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

// Monta a sidebar com os projetos e suas anotações
  function renderizarSidebar(projetos) {
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
  } 
});   