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
    fetch("../backend/verificar_sessao.php")
        .then(res => res.json())
        .then(data => {
            if (!data.logado) return;

            montarNavbar();
        })
        .catch(() => {
            console.error("Erro ao verificar sessão.");
        });

    function montarNavbar() {
        const loginBtn = document.querySelector('a[href="login.html"]')?.parentElement;
        const cadastroBtn = document.querySelector('a[href="cadastro.html"]')?.parentElement;
        const nav = document.querySelector("nav");

        if (loginBtn) loginBtn.style.display = "none";
        if (cadastroBtn) cadastroBtn.style.display = "none";

        const dropdownJogo = document.createElement("div");
        dropdownJogo.classList.add("dropdown");

        const btnJogo = document.createElement("button");
        btnJogo.classList.add("btn");
        btnJogo.innerText = "Jogo";
        dropdownJogo.appendChild(btnJogo);

        const dropdownContent = document.createElement("div");
        dropdownContent.classList.add("dropdown-content");

        const options = [
            { text: "Fichas", href: "ficha.html" },
            { text: "Mapas", href: "map.html" },
            { text: "Party", href: "party.html" },
            { text: "Anotações", href: "anotacoes.html" }
        ];

        options.forEach(option => {
            const link = document.createElement("a");
            link.href = option.href;
            link.innerText = option.text;
            dropdownContent.appendChild(link);
        });

        dropdownJogo.appendChild(dropdownContent);
        nav.appendChild(dropdownJogo);

        btnJogo.addEventListener('click', function (e) {
            e.preventDefault();
            dropdownContent.classList.toggle('show');
        });

        dropdownJogo.addEventListener('mouseenter', function () {
            dropdownContent.classList.add('show');
        });

        dropdownJogo.addEventListener('mouseleave', function () {
            dropdownContent.classList.remove('show');
        });

        const btnComunidade = document.createElement("button");
        btnComunidade.classList.add("btn");
        btnComunidade.innerHTML = "<a href='comunidade.html'>Comunidade</a>";
        nav.appendChild(btnComunidade);

        const btnSair = document.createElement("button");
        btnSair.classList.add("btn");
        btnSair.innerText = "Sair";
        btnSair.onclick = () => {
            fetch("../backend/logout.php")
                .then(() => window.location.href = "login.html");
        };
        nav.appendChild(btnSair);

        const btnPerfil = document.createElement("a");
        btnPerfil.href = "perfil.html";
        btnPerfil.title = "Perfil";
        btnPerfil.innerHTML = `
            <div class="profile-icon">
              <img id="iconHeader" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="Perfil">
            </div>
        `;
        nav.appendChild(btnPerfil);

        window.addEventListener('click', function (e) {
            if (!e.target.matches('.btn') && !e.target.closest('.dropdown')) {
                dropdownContent.classList.remove('show');
            }
        });

        const mobileNav = document.querySelector(".mobile-nav");
        if (mobileNav) {
            mobileNav.innerHTML = '';

            const mobileBtnInicio = document.createElement("a");
            mobileBtnInicio.classList.add("btn");
            mobileBtnInicio.href = "main.html";
            mobileBtnInicio.textContent = "Início";
            mobileNav.appendChild(mobileBtnInicio);

            const mobileBtnFicha = document.createElement("a");
            mobileBtnFicha.classList.add("btn");
            mobileBtnFicha.href = "ficha.html";
            mobileBtnFicha.textContent = "Fichas";
            mobileNav.appendChild(mobileBtnFicha);

            const mobileBtnMapas = document.createElement("a");
            mobileBtnMapas.classList.add("btn");
            mobileBtnMapas.href = "map.html";
            mobileBtnMapas.textContent = "Mapas";
            mobileNav.appendChild(mobileBtnMapas);

            const mobileBtnParty = document.createElement("a");
            mobileBtnParty.classList.add("btn");
            mobileBtnParty.href = "party.html";
            mobileBtnParty.textContent = "Party";
            mobileNav.appendChild(mobileBtnParty);

            const mobileBtnComunidade = document.createElement("a");
            mobileBtnComunidade.classList.add("btn");
            mobileBtnComunidade.href = "comunidade.html";
            mobileBtnComunidade.textContent = "Comunidade";
            mobileNav.appendChild(mobileBtnComunidade);
        }
    }
});
