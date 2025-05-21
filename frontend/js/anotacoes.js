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
});