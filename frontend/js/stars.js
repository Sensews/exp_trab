function stars() {
    let e = document.createElement("div");
    e.setAttribute("class", "stars");
    document.body.appendChild(e);

    e.style.left = Math.random() * innerWidth + "px";

    let size = Math.random() * 15 + 10;
    e.style.fontSize = size + "px";

    let duration = Math.random() * 9 + 6; 
    e.style.animationDuration = duration + "s";

    setTimeout(() => {
        e.remove();
    }, duration * 1000);
}

setInterval(() => {
    if (document.querySelectorAll(".stars").length < 150) {
        stars();
    }
}, 150);
