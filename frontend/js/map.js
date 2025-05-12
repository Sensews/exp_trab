document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("map-container");
    const grid = document.getElementById("grid");
  
    const gridWidth = 10000;
    const gridHeight = 10000;
  
    const viewWidth = container.offsetWidth;
    const viewHeight = container.offsetHeight;
  
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let offsetX = viewWidth / 2 - gridWidth / 2;
    let offsetY = viewHeight / 2 - gridHeight / 2;
    let spacePressed = false;
    let scale = 1; // Zoom inicial
  
    function clamp(value, min, max) {
      return Math.max(min, Math.min(value, max));
    }
  
    function updateGridPosition() {
      grid.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }
  
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space") {
        spacePressed = true;
        container.classList.add("space-pressed");
      }
  
      // Resetar ao pressionar Shift + G
      if (e.key.toLowerCase() === "g" && e.shiftKey) {
        offsetX = viewWidth / 2 - gridWidth / 2;
        offsetY = viewHeight / 2 - gridHeight / 2;
        scale = 1;
        updateGridPosition();
      }
    });
  
    document.addEventListener("keyup", (e) => {
      if (e.code === "Space") {
        spacePressed = false;
        container.classList.remove("space-pressed");
      }
    });
  
    container.addEventListener("mousedown", (e) => {
      if (!spacePressed) return;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      container.classList.add("dragging");
    });
  
    document.addEventListener("mouseup", () => {
      isDragging = false;
      container.classList.remove("dragging");
    });
  
    document.addEventListener("mousemove", (e) => {
      if (!isDragging || !spacePressed) return;
  
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
  
      offsetX = clamp(offsetX + dx, -gridWidth * scale + 100, viewWidth - 100);
      offsetY = clamp(offsetY + dy, -gridHeight * scale + 100, viewHeight - 100);
  
      updateGridPosition();
    });
  
    // 🎯 Zoom com roda do mouse
    container.addEventListener("wheel", (e) => {
      e.preventDefault();
  
      const zoomIntensity = 0.1;
      const delta = e.deltaY < 0 ? 1 : -1;
  
      const newScale = clamp(scale + delta * zoomIntensity, 0.7, 1.5);
  
      // Fixar ponto de zoom no centro da tela
      const zoomFactor = newScale / scale;
      offsetX = (offsetX - viewWidth / 2) * zoomFactor + viewWidth / 2;
      offsetY = (offsetY - viewHeight / 2) * zoomFactor + viewHeight / 2;
  
      scale = newScale;
      updateGridPosition();
    }, { passive: false });
  
    updateGridPosition(); // Centraliza ao iniciar
  
    const fabToggle = document.getElementById("fabToggle");
    const fabButtons = document.getElementById("fabButtons");
  
    fabToggle.addEventListener("click", () => {
      fabButtons.classList.toggle("show");
    });
  });
  