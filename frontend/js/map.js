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
    let scale = 1;
  
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
      desenhando = false;
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
  
    container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomIntensity = 0.1;
      const delta = e.deltaY < 0 ? 1 : -1;
      const newScale = clamp(scale + delta * zoomIntensity, 0.7, 1.5);
      const zoomFactor = newScale / scale;
      offsetX = (offsetX - viewWidth / 2) * zoomFactor + viewWidth / 2;
      offsetY = (offsetY - viewHeight / 2) * zoomFactor + viewHeight / 2;
      scale = newScale;
      updateGridPosition();
    }, { passive: false });
  
    updateGridPosition();
  
    const fabToggle = document.getElementById("fabToggle");
    const fabButtons = document.getElementById("fabButtons");
  
    fabToggle.addEventListener("click", () => {
      fabButtons.classList.toggle("show");
    });
  
    // 🎨 Modo Pincel UI
    const pincelBtn = document.querySelector('.fab-buttons button:nth-child(1)');
    const pincelMenu = document.getElementById('pincelMenu');
    const corButtons = document.querySelectorAll('.cor');
    const espessuraInput = document.getElementById('espessura');
    const borrachaBtn = document.getElementById('borrachaBtn');
  
    let pincelAtivo = false;
    let corSelecionada = "#ffffff";
    let espessura = 5;
  
    pincelBtn.addEventListener("click", () => {
      pincelAtivo = !pincelAtivo;
      pincelMenu.classList.toggle("hidden", !pincelAtivo);
    });
  
    corButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        corSelecionada = btn.dataset.cor;
      });
    });
  
    espessuraInput.addEventListener("input", () => {
      espessura = parseInt(espessuraInput.value);
    });
  
    borrachaBtn.addEventListener("click", () => {
      corSelecionada = "transparent";
    });
  
    // 🖌️ Função de desenho
    let desenhando = false;
  
    grid.addEventListener("mousedown", (e) => {
      if (!pincelAtivo) return;
      desenhando = true;
      desenhar(e);
    });
  
    grid.addEventListener("mousemove", (e) => {
      if (desenhando && pincelAtivo) desenhar(e);
    });
    
    let lastDrawX = null;
    let lastDrawY = null;
    
    function desenhar(e) {
      const rect = grid.getBoundingClientRect();
      const scaleX = grid.offsetWidth / rect.width;
      const scaleY = grid.offsetHeight / rect.height;
    
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
    
      if (lastDrawX !== null && lastDrawY !== null) {
        const dx = x - lastDrawX;
        const dy = y - lastDrawY;
        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist / (espessura / 2));
    
        for (let i = 0; i < steps; i++) {
          const ix = lastDrawX + (dx * i) / steps;
          const iy = lastDrawY + (dy * i) / steps;
          desenharPonto(ix, iy);
        }
      }
    
      desenharPonto(x, y);
      lastDrawX = x;
      lastDrawY = y;
    }
    
    function desenharPonto(x, y) {
        if (corSelecionada === "transparent") {
          const pontos = document.querySelectorAll(".dot");
      
          pontos.forEach(dot => {
            const dotX = parseFloat(dot.style.left) + parseFloat(dot.style.width) / 2;
            const dotY = parseFloat(dot.style.top) + parseFloat(dot.style.height) / 2;
      
            const dist = Math.hypot(dotX - x, dotY - y);
            if (dist < espessura) {
              dot.remove();
            }
          });
      
          return;
        }
      
        const dot = document.createElement("div");
        dot.classList.add("dot");
        dot.style.left = `${x - espessura / 2}px`;
        dot.style.top = `${y - espessura / 2}px`;
        dot.style.width = `${espessura}px`;
        dot.style.height = `${espessura}px`;
        dot.style.position = "absolute";
        dot.style.borderRadius = "50%";
        dot.style.pointerEvents = "none";
        dot.style.backgroundColor = corSelecionada;
      
        grid.appendChild(dot);
      }
    
    document.addEventListener("mouseup", () => {
        isDragging = false;
        container.classList.remove("dragging");
        desenhando = false;
        lastDrawX = null;
        lastDrawY = null;
      });
      

  });
  