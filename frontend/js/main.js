document.addEventListener("DOMContentLoaded", () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("modelo3D"), alpha: true });

    renderer.setSize(window.innerWidth * 0.6, window.innerHeight * 0.6);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.querySelector(".canvas-container").appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(3, 5, 5);
    scene.add(directionalLight);

    camera.position.set(0, 2, 8);

    const loader = new THREE.GLTFLoader();
    let diceModel;

    loader.load("images/dado.glb", (gltf) => {
        diceModel = gltf.scene;
        diceModel.scale.set(0.033, 0.033, 0.033);
        diceModel.position.set(0, 2, 0);
        scene.add(diceModel);
    });

    function animate() {
        requestAnimationFrame(animate);
        if (diceModel) {
            diceModel.rotation.y += 0.005;
        }
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener("resize", () => {
        const width = window.innerWidth * 0.6;
        const height = window.innerHeight * 0.6;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    let isDragging = false, previousMouseX, previousMouseY;

    function startDrag(event) {
        isDragging = true;
        previousMouseX = event.touches ? event.touches[0].clientX : event.clientX;
        previousMouseY = event.touches ? event.touches[0].clientY : event.clientY;
    }

    function moveDrag(event) {
        if (isDragging && diceModel) {
            let deltaX = (event.touches ? event.touches[0].clientX : event.clientX) - previousMouseX;
            let deltaY = (event.touches ? event.touches[0].clientY : event.clientY) - previousMouseY;
            diceModel.rotation.y += deltaX * 0.005;
            diceModel.rotation.x += deltaY * 0.005;
            previousMouseX = event.touches ? event.touches[0].clientX : event.clientX;
            previousMouseY = event.touches ? event.touches[0].clientY : event.clientY;
        }
    }

    function stopDrag() {
        isDragging = false;
    }

    renderer.domElement.addEventListener("mousedown", startDrag);
    renderer.domElement.addEventListener("mousemove", moveDrag);
    renderer.domElement.addEventListener("mouseup", stopDrag);
    renderer.domElement.addEventListener("touchstart", startDrag);
    renderer.domElement.addEventListener("touchmove", moveDrag);
    renderer.domElement.addEventListener("touchend", stopDrag);
});

document.addEventListener("DOMContentLoaded", () => {
    const logado = localStorage.getItem("logado") === "true";

    const loginBtn = document.querySelector('a[href="login.html"]')?.parentElement;
    const cadastroBtn = document.querySelector('a[href="cadastro.html"]')?.parentElement;

    const nav = document.querySelector("nav");

    if (logado) {
        // Esconde os botões de login e cadastro
        if (loginBtn) loginBtn.style.display = "none";
        if (cadastroBtn) cadastroBtn.style.display = "none";

        // Cria botão "Anotações"
        const btnAnotacoes = document.createElement("a");
        btnAnotacoes.classList.add("btn");
        btnAnotacoes.href = "anotacoes.html";
        btnAnotacoes.innerText = "Anotações";
        nav.appendChild(btnAnotacoes);

        // Cria botão "Sair"
        const btnSair = document.createElement("button");
        btnSair.classList.add("btn");
        btnSair.innerText = "Sair";
        btnSair.onclick = () => {
            localStorage.removeItem("logado");
            location.reload();
        };
        nav.appendChild(btnSair);

        // Cria botão "Perfil"
        const btnPerfil = document.createElement("a");
        btnPerfil.href = "perfil.html";
        btnPerfil.title = "Perfil";
        btnPerfil.innerHTML = `
          <div class="profile-icon">
            <img id="iconHeader" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="Perfil">
          </div>
        `;
        nav.appendChild(btnPerfil);    
    }


});
  