function stars() {
    let e = document.createElement("div");
    e.setAttribute("class", "stars");
    document.body.appendChild(e);

    e.style.left = Math.random() * innerWidth + "px";

    let size = Math.random() * 15 + 10;
    e.style.fontSize = size + "px";

    let duration = Math.random() * 9 + 6; // Agora entre 3s e 9s
    e.style.animationDuration = duration + "s";

    // Remover estrela após a animação
    setTimeout(() => {
        e.remove();
    }, duration * 1000);
}

// Criar mais estrelas constantemente sem sobrecarregar a página
setInterval(() => {
    if (document.querySelectorAll(".stars").length < 150) { // Agora até 150 estrelas simultâneas
        stars();
    }
}, 150); // A cada 150ms uma nova estrela cai
