document.addEventListener("DOMContentLoaded", () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("modelo3D"), alpha: true });

    renderer.setSize(window.innerWidth * 0.6, window.innerHeight * 0.6);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.querySelector(".canvas-container").appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 60);
    directionalLight.position.set(3, 5, 5);
    scene.add(directionalLight);

    camera.position.set(-1, 2, 8);

    const loader = new THREE.GLTFLoader();
    let diceModel;

    loader.load("images/dado-cadastro.glb", (gltf) => {
        diceModel = gltf.scene;
        diceModel.scale.set(3.5, 3.5, 3.5);
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
