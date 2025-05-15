// CONFIGURAÇÃO INICIAL DO MAPA
document.addEventListener("DOMContentLoaded", () => {
  // Elementos principais e dimensões
  const container = document.getElementById("map-container");
  const grid = document.getElementById("grid");
  const gridWidth = 10000;
  const gridHeight = 10000;
  const viewWidth = container.offsetWidth;
  const viewHeight = container.offsetHeight;
  
  // Variáveis de controle de navegação
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let offsetX = viewWidth / 2 - gridWidth / 2;
  let offsetY = viewHeight / 2 - gridHeight / 2;
  let spacePressed = false;
  let scale = 1;
  let shiftPressed = false;
  
  // Variáveis de desenho
  const svgNamespace = "http://www.w3.org/2000/svg";
  let currentPath = null;
  let pathPoints = [];
  
  // Variáveis de gerenciamento de imagens
  let nextZIndex = -1;
  let backgroundImages = [];
  let selectedImage = null;
  let isResizing = false;
  let isRotating = false;
  let resizeHandle = '';
  let startX, startY, startWidth, startHeight, startAngle, startRotation;
  
  // Variáveis de desenho à mão livre
  let pincelAtivo = false;
  let corSelecionada = "#ffffff";
  let espessura = 5;
  let desenhando = false;
  let lastDrawX = null;
  let lastDrawY = null;
  
  // GERENCIAMENTO DE TOKENS
  let tokens = [];
  let tokenLibrary = [];
  let selectedToken = null;
  let isDraggingToken = false;
  let tokenDragStartX, tokenDragStartY;
  
  // FUNÇÕES AUXILIARES GERAIS
  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }
  
  // Torna o grid mais estável ao prevenir movimentações acidentais
  function updateGridPosition() {
    // Arredondar os valores para evitar subpixel rendering que pode causar oscilações
    const roundedOffsetX = Math.round(offsetX * 100) / 100;
    const roundedOffsetY = Math.round(offsetY * 100) / 100;
    const roundedScale = Math.round(scale * 1000) / 1000;
    
    // Aplicar transform com valores arredondados
    grid.style.transform = `translate(${roundedOffsetX}px, ${roundedOffsetY}px) scale(${roundedScale})`;
    
    // Atualizar informação de debug se necessário
    if (document.getElementById('debug-info')) {
      document.getElementById('debug-info').textContent = 
        `Offset: ${roundedOffsetX}x${roundedOffsetY}, Scale: ${roundedScale}`;
    }
  }
  
  // GERENCIAMENTO DE IMAGENS DE FUNDO
  function addBackgroundImage(imageUrl) {
    const img = document.createElement('div');
    img.className = 'background-image';
    img.style.backgroundImage = `url(${imageUrl})`;
    img.style.backgroundSize = 'contain';
    img.style.backgroundRepeat = 'no-repeat';
    img.style.width = '300px';
    img.style.height = '300px';
    img.style.position = 'absolute';
    
    const centerX = -offsetX + viewWidth / 2;
    const centerY = -offsetY + viewHeight / 2;
    img.style.left = `${centerX}px`;
    img.style.top = `${centerY}px`;
    img.style.transform = 'translate(-50%, -50%)';
    img.style.zIndex = nextZIndex--;
    
    grid.insertBefore(img, grid.firstChild);
    
    addImageControls(img);
    
    backgroundImages.push({
      element: img,
      url: imageUrl,
      width: 300,
      height: 300,
      x: centerX,
      y: centerY,
      rotation: 0,
      zIndex: parseInt(img.style.zIndex)
    });
    
    selectImage(img);
  }
  
  function addImageControls(imgElement) {
    imgElement.style.pointerEvents = 'auto';
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'image-controls-container';
    controlsContainer.style.display = 'none';
    imgElement.appendChild(controlsContainer);
    
    const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    
    handles.forEach(position => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${position}`;
      handle.dataset.handle = position;
      handle.style.zIndex = '1000';
      controlsContainer.appendChild(handle);
      
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startResize(e);
      });
    });
    
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    rotateHandle.style.zIndex = '1000';
    controlsContainer.appendChild(rotateHandle);
    
    rotateHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      startRotate(e);
    });
    
    const toolbar = document.createElement('div');
    toolbar.className = 'image-toolbar';
    toolbar.style.zIndex = '1000';
    
    toolbar.innerHTML = `
      <div class="toolbar-group">
        <button class="btn-anchor-image" title="Ancorar imagem"><i class="fas fa-thumbtack"></i></button>
        <button class="btn-delete-image" title="Excluir imagem"><i class="fas fa-trash"></i></button>
      </div>
      <div class="toolbar-group">
        <button class="btn-layer-up" title="Trazer para frente"><i class="fas fa-arrow-up"></i></button>
        <button class="btn-layer-down" title="Enviar para trás"><i class="fas fa-arrow-down"></i></button>
      </div>
    `;
    
    controlsContainer.appendChild(toolbar);
    
    toolbar.querySelector('.btn-delete-image').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteImage(imgElement);
    });
    
    toolbar.querySelector('.btn-anchor-image').addEventListener('click', (e) => {
      e.stopPropagation();
      anchorImage(imgElement);
    });
    
    toolbar.querySelector('.btn-layer-up').addEventListener('click', (e) => {
      e.stopPropagation();
      moveImageLayer(imgElement, 'up');
    });
    
    toolbar.querySelector('.btn-layer-down').addEventListener('click', (e) => {
      e.stopPropagation();
      moveImageLayer(imgElement, 'down');
    });
    
    imgElement.dataset.anchored = 'false';
    
    imgElement.addEventListener('mousedown', (e) => {
      if (spacePressed) {
        return;
      }
      
      const isAnchored = imgElement.dataset.anchored === 'true';
      
      if (isAnchored && !shiftPressed) {
        return;
      }
      
      const isControlElement = e.target.closest('.resize-handle') || 
                              e.target.closest('.rotate-handle') || 
                              e.target.closest('.image-toolbar');
      
      if (isControlElement) {
        e.stopPropagation();
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      selectImage(imgElement);
      
      if (!isAnchored) {
        startDragImage(e);
      }
    });
  }
  
  function moveImageLayer(imgElement, direction) {
    const imgData = getImageData(imgElement);
    const currentZIndex = imgData.zIndex || parseInt(imgElement.style.zIndex);
    let newZIndex = currentZIndex;
    
    const allImages = backgroundImages.map(img => ({
      element: img.element,
      zIndex: img.zIndex || parseInt(img.element.style.zIndex) || 0
    })).sort((a, b) => a.zIndex - b.zIndex);
    
    if (direction === 'up') {
      for (let i = 0; i < allImages.length; i++) {
        if (allImages[i].zIndex > currentZIndex) {
          newZIndex = allImages[i].zIndex + 1;
          break;
        }
      }
      if (newZIndex === currentZIndex) {
        newZIndex = Math.min(-1, currentZIndex + 1);
      }
    } else if (direction === 'down') {
      for (let i = allImages.length - 1; i >= 0; i--) {
        if (allImages[i].zIndex < currentZIndex) {
          newZIndex = allImages[i].zIndex - 1;
          break;
        }
      }
      if (newZIndex === currentZIndex) {
        newZIndex = Math.min(-50, currentZIndex - 1);
      }
    }
    
    imgElement.style.zIndex = newZIndex;
    
    updateImageData(imgElement, { zIndex: newZIndex });
    
    if (newZIndex <= nextZIndex) {
      nextZIndex = newZIndex - 1;
    }
  }
  
  function anchorImage(imgElement) {
    const isCurrentlyAnchored = imgElement.dataset.anchored === 'true';
    const newAnchorState = !isCurrentlyAnchored;
    
    imgElement.dataset.anchored = newAnchorState ? 'true' : 'false';
    
    const anchorButton = imgElement.querySelector('.btn-anchor-image');
    if (anchorButton) {
      if (newAnchorState) {
        anchorButton.innerHTML = '<i class="fas fa-lock"></i>';
        anchorButton.title = "Desancorar imagem";
        anchorButton.classList.add('anchored');
      } else {
        anchorButton.innerHTML = '<i class="fas fa-thumbtack"></i>';
        anchorButton.title = "Ancorar imagem";
        anchorButton.classList.remove('anchored');
      }
    }
    
    if (newAnchorState) {
      imgElement.classList.add('anchored');
      deselectImage();
    } else {
      imgElement.classList.remove('anchored');
    }
    
    updateImageData(imgElement, { anchored: newAnchorState });
  }
  
  function selectImage(imgElement) {
    deselectImage();
    
    selectedImage = imgElement;
    selectedImage.classList.add('selected');
    
    const controlsContainer = imgElement.querySelector('.image-controls-container');
    if (controlsContainer) {
      controlsContainer.style.display = 'block';
    }
  }
  
  function deselectImage() {
    if (selectedImage) {
      selectedImage.classList.remove('selected');
      
      const controlsContainer = selectedImage.querySelector('.image-controls-container');
      if (controlsContainer) {
        controlsContainer.style.display = 'none';
      }
      
      selectedImage = null;
    }
  }
  
  function deleteImage(imgElement) {
    const index = backgroundImages.findIndex(item => item.element === imgElement);
    if (index !== -1) {
      backgroundImages.splice(index, 1);
      imgElement.remove();
      
      if (selectedImage === imgElement) {
        selectedImage = null;
      }
    }
  }
  
  function startDragImage(e) {
    if (!selectedImage || isResizing || isRotating || spacePressed) return;
    
    startX = e.clientX;
    startY = e.clientY;
    
    grid.classList.add('editing-image');
    
    document.addEventListener('mousemove', dragImage);
    document.addEventListener('mouseup', stopDragImage);
  }
  
  function dragImage(e) {
    if (!selectedImage || isResizing || isRotating) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const dx = (e.clientX - startX) / scale;
    const dy = (e.clientY - startY) / scale;
    
    const imgData = getImageData(selectedImage);
    const newX = imgData.x + dx;
    const newY = imgData.y + dy;
    
    selectedImage.style.left = `${newX}px`;
    selectedImage.style.top = `${newY}px`;
    
    updateImageData(selectedImage, { x: newX, y: newY });
    
    startX = e.clientX;
    startY = e.clientY;
  }
  
  function stopDragImage() {
    grid.classList.remove('editing-image');
    document.removeEventListener('mousemove', dragImage);
    document.removeEventListener('mouseup', stopDragImage);
  }
  
  function getImageData(imgElement) {
    const index = backgroundImages.findIndex(item => item.element === imgElement);
    if (index !== -1) {
      return backgroundImages[index];
    }
    return {
      width: parseFloat(imgElement.style.width),
      height: parseFloat(imgElement.style.height),
      x: parseFloat(imgElement.style.left),
      y: parseFloat(imgElement.style.top),
      rotation: 0,
      anchored: imgElement.dataset.anchored === 'true'
    };
  }
  
  function updateImageData(imgElement, newData) {
    const index = backgroundImages.findIndex(item => item.element === imgElement);
    if (index !== -1) {
      backgroundImages[index] = {
        ...backgroundImages[index],
        ...newData
      };
    }
  }
  
  // REDIMENSIONAMENTO E ROTAÇÃO DE IMAGENS
  function startResize(e) {
    if (spacePressed || !selectedImage) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isResizing = true;
    resizeHandle = e.target.dataset.handle;
    
    const imgStyle = window.getComputedStyle(selectedImage);
    startWidth = parseFloat(imgStyle.width);
    startHeight = parseFloat(imgStyle.height);
    startX = e.clientX;
    startY = e.clientY;
    
    document.addEventListener('mousemove', resizeImage);
    document.addEventListener('mouseup', stopResize);
  }
  
  function resizeImage(e) {
    if (!isResizing || !selectedImage) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    const aspectRatio = startWidth / startHeight;
    
    if (resizeHandle === 'bottom-right') {
      newWidth = Math.max(50, startWidth + dx);
      newHeight = newWidth / aspectRatio;
    } else if (resizeHandle === 'top-left') {
      newWidth = Math.max(50, startWidth - dx);
      newHeight = newWidth / aspectRatio;
    } else if (resizeHandle === 'top-right') {
      newWidth = Math.max(50, startWidth + dx);
      newHeight = newWidth / aspectRatio;
    } else if (resizeHandle === 'bottom-left') {
      newWidth = Math.max(50, startWidth - dx);
      newHeight = newWidth / aspectRatio;
    }
    
    selectedImage.style.width = `${newWidth}px`;
    selectedImage.style.height = `${newHeight}px`;
    
    const imgData = getImageData(selectedImage);
    const rotation = imgData.rotation || 0;
    selectedImage.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    
    updateImageData(selectedImage, {
      width: newWidth,
      height: newHeight
    });
    
    startX = e.clientX;
    startY = e.clientY;
    startWidth = newWidth;
    startHeight = newHeight;
  }
  
  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resizeImage);
    document.removeEventListener('mouseup', stopResize);
  }
  
  function startRotate(e) {
    if (spacePressed || !selectedImage) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isRotating = true;
    
    const rect = selectedImage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    const imgData = getImageData(selectedImage);
    startRotation = imgData.rotation || 0;
    
    document.addEventListener('mousemove', rotateImage);
    document.addEventListener('mouseup', stopRotate);
  }
  
  function rotateImage(e) {
    if (!isRotating || !selectedImage) return;
    
    e.preventDefault();
    
    const rect = selectedImage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const angleDiff = (angle - startAngle) * (180 / Math.PI);
    
    const newRotation = (startRotation + angleDiff) % 360;
    selectedImage.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
    
    updateImageData(selectedImage, { rotation: newRotation });
  }
  
  function stopRotate() {
    isRotating = false;
    document.removeEventListener('mousemove', rotateImage);
    document.removeEventListener('mouseup', stopRotate);
  }
  
  // NAVEGAÇÃO E CONTROLE DE TECLADO
  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") {
      shiftPressed = true;
    }
    
    if (e.code === "Space") {
      if (isResizing || isRotating || isDraggingToken) return;
      
      spacePressed = true;
      container.classList.add("space-pressed");
      document.body.style.cursor = 'grab';
      
      document.querySelectorAll('.background-image').forEach(img => {
        img.classList.add('ignore-mouse');
      });
      
      if (desenhando) {
        currentPath = null;
        pathPoints = [];
        desenhando = false;
      }
      
      e.preventDefault();
    }

    // Mover token selecionado com as setas
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (!spacePressed && selectedToken) {
        e.preventDefault();
        moveSelectedTokenWithArrows(e.key);
      }
    }

    if (e.key.toLowerCase() === "g" && e.shiftKey) {
      offsetX = viewWidth / 2 - gridWidth / 2;
      offsetY = viewHeight / 2 - gridHeight / 2;
      scale = 1;
      updateGridPosition();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") {
      shiftPressed = false;
    }
    
    if (e.code === "Space") {
      spacePressed = false;
      container.classList.remove("space-pressed");
      document.body.style.cursor = '';
      
      document.querySelectorAll('.background-image').forEach(img => {
        img.classList.remove('ignore-mouse');
      });
    }
  });
  
  // EVENTOS DO MOUSE
  container.addEventListener("mousedown", (e) => {
    if (spacePressed) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      container.classList.add("dragging");
      document.body.style.cursor = 'grabbing';
      
      if (container.setPointerCapture) {
        container.setPointerCapture(e.pointerId);
      }
      
      e.preventDefault();
      e.stopPropagation();
    }
  });
  
  document.addEventListener("mouseup", () => {
    isDragging = false;
    container.classList.remove("dragging");
    
    if (desenhando) {
      currentPath = null;
      pathPoints = [];
    }
    
    desenhando = false;
    lastDrawX = null;
    lastDrawY = null;
  });
  
  document.addEventListener("mousemove", (e) => {
    if (!isDragging || !spacePressed) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Calcular novos offsets
    const newOffsetX = offsetX + dx;
    const newOffsetY = offsetY + dy;
    
    // Calcular os limites baseados no zoom atual
    const leftLimit = viewWidth - gridWidth * scale * 0.2; // Permite ver 20% do grid além da borda
    const rightLimit = gridWidth * scale * 0.2 - viewWidth; // Similar para a direita
    const topLimit = viewHeight - gridHeight * scale * 0.2; // Similar para cima
    const bottomLimit = gridHeight * scale * 0.2 - viewHeight; // Similar para baixo
    
    // Aplicar limites mais flexíveis, adaptando-se ao nível de zoom
    offsetX = Math.max(Math.min(newOffsetX, leftLimit), -rightLimit);
    offsetY = Math.max(Math.min(newOffsetY, topLimit), -bottomLimit);

    updateGridPosition();
  });
  
  // ZOOM COM RODA DO MOUSE
  container.addEventListener("wheel", (e) => {
    if (spacePressed) return; 
    e.preventDefault();

    // Escala de zoom mais suave
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    
    // Calcula o novo valor de escala com limites
    const oldScale = scale;
    const newScale = direction > 0 
      ? Math.min(scale * zoomFactor, 3.0) 
      : Math.max(scale / zoomFactor, 0.3);
    
    if (newScale === oldScale) return; // Não fazer nada se estiver nos limites
    
    // Posição do mouse relativa à janela
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Posição do mouse relativa ao grid (em coordenadas do grid)
    const gridMouseX = (mouseX - offsetX) / oldScale;
    const gridMouseY = (mouseY - offsetY) / oldScale;
    
    // Calcular novo offset para manter o ponto sob o cursor fixo
    offsetX = mouseX - gridMouseX * newScale;
    offsetY = mouseY - gridMouseY * newScale;
    
    // Aplicar nova escala
    scale = newScale;
    
    updateGridPosition();
  }, { passive: false });
  
  // DESELECIONAR QUANDO CLICAR FORA
  document.addEventListener("mousedown", (e) => {
    if (selectedImage && 
        !e.target.closest('.background-image') && 
        !e.target.closest('.image-controls-container')) {
      deselectImage();
    }
  });
  
  // DESATIVAR EVENTOS DE MOUSE EM IMAGENS QUANDO NAVEGANDO
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      .background-image {
        position: absolute;
        pointer-events: auto !important; 
        z-index: -1;
      }
      
      #grid * {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
  });
  
  // FUNÇÕES DE DESENHO À MÃO LIVRE
  grid.addEventListener("mousedown", (e) => {
    if (!pincelAtivo || spacePressed) return;
    desenhando = true;
    
    currentPath = null;
    
    if (corSelecionada === "transparent") {
      useBorracha(e);
    } else {
      desenhar(e);
    }
  });
  
  grid.addEventListener("mousemove", (e) => {
    if (desenhando && pincelAtivo && !spacePressed) {
      if (corSelecionada === "transparent") {
        useBorracha(e);
      } else {
        desenhar(e);
      }
    }
  });
  
  function desenhar(e) {
    const rect = grid.getBoundingClientRect();
    const scaleX = grid.offsetWidth / rect.width;
    const scaleY = grid.offsetHeight / rect.height;
  
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
  
    if (!currentPath) {
      const svg = document.createElementNS(svgNamespace, "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.pointerEvents = "none";
      svg.classList.add("drawing-svg");
      
      currentPath = document.createElementNS(svgNamespace, "path");
      currentPath.setAttribute("stroke", corSelecionada);
      currentPath.setAttribute("stroke-width", espessura);
      currentPath.setAttribute("fill", "none");
      currentPath.setAttribute("stroke-linecap", "round");
      currentPath.setAttribute("stroke-linejoin", "round");
      
      pathPoints = [`M ${x} ${y}`];
      currentPath.setAttribute("d", pathPoints.join(" "));
      
      svg.appendChild(currentPath);
      grid.appendChild(svg);
    } else {
      pathPoints.push(`L ${x} ${y}`);
      currentPath.setAttribute("d", pathPoints.join(" "));
    }
  
    lastDrawX = x;
    lastDrawY = y;
  }
  
  function useBorracha(e) {
    const rect = grid.getBoundingClientRect();
    const scaleX = grid.offsetWidth / rect.width;
    const scaleY = grid.offsetHeight / rect.height;
  
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
  
    const paths = grid.querySelectorAll("svg path");
    const eraserSize = espessura;
    
    paths.forEach(path => {
      const bbox = path.getBBox();
      if (x >= bbox.x - eraserSize && 
          x <= bbox.x + bbox.width + eraserSize && 
          y >= bbox.y - eraserSize && 
          y <= bbox.y + bbox.height + eraserSize) {
        path.parentNode.removeChild(path);
      }
    });
  }
  
  // INTERFACE DE USUÁRIO
  updateGridPosition();
  
  const fabToggle = document.getElementById("fabToggle");
  const fabButtons = document.getElementById("fabButtons");
  
  fabToggle.addEventListener("click", () => {
    fabButtons.classList.toggle("show");
  });
  
  // CONTROLES DE PINCEL
  const pincelBtn = document.querySelector('.fab-buttons button:nth-child(1)');
  const pincelMenu = document.getElementById('pincelMenu');
  const corButtons = document.querySelectorAll('.cor');
  const espessuraInput = document.getElementById('espessura');
  const borrachaBtn = document.getElementById('borrachaBtn');
  
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
  
  // GERENCIAMENTO DE IMAGENS
  const addImageBtn = document.querySelector('.fab-buttons button:nth-child(3)');
  const imageMenu = document.getElementById('imageMenu');
  const imageInput = document.getElementById('imageInput');
  const confirmImageBtn = document.getElementById('confirmImageBtn');
  const cancelImageBtn = document.getElementById('cancelImageBtn');
  
  addImageBtn.addEventListener('click', () => {
    imageMenu.classList.remove('hidden');
  });
  
  cancelImageBtn.addEventListener('click', () => {
    imageMenu.classList.add('hidden');
    imageInput.value = '';
  });
  
  confirmImageBtn.addEventListener('click', () => {
    if (imageInput.files && imageInput.files[0]) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        addBackgroundImage(e.target.result);
        imageMenu.classList.add('hidden');
        imageInput.value = '';
      };
      
      reader.readAsDataURL(imageInput.files[0]);
    }
  });
  
  // Adicione esta função à seção GERENCIAMENTO DE TOKENS
  function initializeTokenSystem() {
    // Botão de adicionar token (o botão com "+")
    const addTokenBtn = document.querySelector('.fab-buttons button:nth-child(4)');
    const tokenMenu = document.getElementById('tokenMenu');
    const tokenInput = document.getElementById('tokenInput');
    const confirmTokenBtn = document.getElementById('confirmTokenBtn');
    const tokenLibraryElement = document.getElementById('tokenLibrary');
    const tokenSizeSelector = document.getElementById('tokenSizeSelector');
    
    // Mostrar menu de tokens ao clicar no botão +
    addTokenBtn.addEventListener('click', () => {
      tokenMenu.classList.remove('hidden');
    });
    
    // Adicionar token à biblioteca
    confirmTokenBtn.addEventListener('click', () => {
      if (tokenInput.files && tokenInput.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          const tokenSize = parseInt(tokenSizeSelector.value);
          const newToken = {
            id: `token-${Date.now()}`,
            url: e.target.result,
            size: tokenSize
          };
          
          tokenLibrary.push(newToken);
          addTokenToLibrary(newToken);
          
          // Limpar input
          tokenInput.value = '';
        };
        
        reader.readAsDataURL(tokenInput.files[0]);
      }
    });
    
    // Função para adicionar token visualmente à biblioteca
    function addTokenToLibrary(token) {
      const tokenElement = document.createElement('div');
      tokenElement.className = 'token-item';
      tokenElement.style.backgroundImage = `url(${token.url})`;
      tokenElement.dataset.id = token.id;
      tokenElement.dataset.size = token.size;
      tokenElement.title = `Token ${token.size}x${token.size}`;
      
      // Fazer o token ser arrastável da biblioteca para o grid
      tokenElement.addEventListener('mousedown', (e) => {
        e.preventDefault();
        
        // Criar elemento temporário para arrastar
        const dragToken = document.createElement('div');
        dragToken.className = 'grid-token dragging';
        dragToken.style.backgroundImage = `url(${token.url})`;
        dragToken.style.width = `${token.size * 50}px`;
        dragToken.style.height = `${token.size * 50}px`;
        dragToken.style.position = 'fixed';
        dragToken.style.pointerEvents = 'none';
        dragToken.style.zIndex = '9999';
        dragToken.style.opacity = '0.8';
        dragToken.dataset.id = token.id;
        dragToken.dataset.size = token.size;
        document.body.appendChild(dragToken);
        
        // Posicionar no mouse
        const halfWidth = dragToken.offsetWidth / 2;
        const halfHeight = dragToken.offsetHeight / 2;
        dragToken.style.left = `${e.clientX - halfWidth}px`;
        dragToken.style.top = `${e.clientY - halfHeight}px`;
        
        // Mover com o mouse
        const moveHandler = (moveEvent) => {
          dragToken.style.left = `${moveEvent.clientX - halfWidth}px`;
          dragToken.style.top = `${moveEvent.clientY - halfHeight}px`;
        };
        
        // Soltar o token - CORRIGIDO
        const upHandler = (upEvent) => {
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', upHandler);
          
          // Calcular a posição no grid com correção de escala e offset
          const rect = grid.getBoundingClientRect();
          
          // Verificar se o mouse está dentro da área do grid
          if (upEvent.clientX >= rect.left && upEvent.clientX <= rect.right &&
              upEvent.clientY >= rect.top && upEvent.clientY <= rect.bottom) {
              
            // Converter coordenadas da janela para coordenadas do grid
            // 1. Primeiro, obter posição relativa ao container do grid
            const containerX = upEvent.clientX - rect.left;
            const containerY = upEvent.clientY - rect.top;
            
            // 2. Depois, converter para posição no grid considerando escala e offset
            // (subtraindo offset e dividindo pela escala)
            const gridX = (containerX / scale) - (offsetX / scale);
            const gridY = (containerY / scale) - (offsetY / scale);
            
            // 3. Ajustar à grade para snap
            const cellSize = 50;
            const snappedX = Math.round(gridX / cellSize) * cellSize;
            const snappedY = Math.round(gridY / cellSize) * cellSize;
            
            // Finalmente adicionar o token na posição correta
            addTokenToGrid(token, snappedX, snappedY);
          }
          
          // Remover o elemento temporário
          dragToken.remove();
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
      });
      
      // Adicionar à biblioteca
      tokenLibraryElement.appendChild(tokenElement);
    }
  }
  
  // Função para adicionar um token ao grid
  function addTokenToGrid(tokenData, x, y) {
    const tokenElement = document.createElement('div');
    tokenElement.className = 'grid-token';
    tokenElement.style.backgroundImage = `url(${tokenData.url})`;
    
    const cellSize = 50;
    tokenElement.style.width = `${tokenData.size * cellSize}px`;
    tokenElement.style.height = `${tokenData.size * cellSize}px`;
    tokenElement.style.left = `${x}px`;
    tokenElement.style.top = `${y}px`;
    tokenElement.dataset.size = tokenData.size;
    
    // Armazenar dados do token
    const token = {
      id: `grid-token-${Date.now()}`,
      element: tokenElement,
      x: x,
      y: y,
      size: tokenData.size,
      url: tokenData.url
    };
    
    tokenElement.dataset.id = token.id;
    
    // Adicionar evento de selecionar token
    tokenElement.addEventListener('mousedown', (e) => {
      if (spacePressed) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      selectToken(token);
      
      if (e.button === 0) { // Botão esquerdo
        startDragToken(e);
      }
    });
    
    grid.appendChild(tokenElement);
    tokens.push(token);
    selectToken(token);
  }
  
  // Função para selecionar um token
  function selectToken(token) {
    // Deselecionar token atual
    if (selectedToken) {
      selectedToken.element.classList.remove('selected');
    }
    
    // Selecionar novo token
    selectedToken = token;
    selectedToken.element.classList.add('selected');
  }
  
  // Função para deselecionar token
  function deselectToken() {
    if (selectedToken) {
      selectedToken.element.classList.remove('selected');
      selectedToken = null;
    }
  }
  
  // Função para começar a arrastar um token
  function startDragToken(e) {
    if (!selectedToken) return;
    
    isDraggingToken = true;
    tokenDragStartX = e.clientX;
    tokenDragStartY = e.clientY;
    
    document.addEventListener('mousemove', dragToken);
    document.addEventListener('mouseup', stopDragToken);
  }
  
  // Função para arrastar um token
  function dragToken(e) {
    if (!isDraggingToken || !selectedToken) return;
    
    e.preventDefault();
    
    const dx = (e.clientX - tokenDragStartX) / scale;
    const dy = (e.clientY - tokenDragStartY) / scale;
    
    const cellSize = 50;
    const newX = Math.round((selectedToken.x + dx) / cellSize) * cellSize;
    const newY = Math.round((selectedToken.y + dy) / cellSize) * cellSize;
    
    selectedToken.x = newX;
    selectedToken.y = newY;
    selectedToken.element.style.left = `${newX}px`;
    selectedToken.element.style.top = `${newY}px`;
    
    tokenDragStartX = e.clientX;
    tokenDragStartY = e.clientY;
  }
  
  // Função para parar de arrastar um token
  function stopDragToken() {
    isDraggingToken = false;
    document.removeEventListener('mousemove', dragToken);
    document.removeEventListener('mouseup', stopDragToken);
  }
  
  // Função para mover token com as setas do teclado
  function moveSelectedTokenWithArrows(direction) {
    if (!selectedToken) return;
    
    const cellSize = 50;
    
    switch (direction) {
      case 'ArrowUp':
        selectedToken.y -= cellSize;
        break;
      case 'ArrowDown':
        selectedToken.y += cellSize;
        break;
      case 'ArrowLeft':
        selectedToken.x -= cellSize;
        break;
      case 'ArrowRight':
        selectedToken.x += cellSize;
        break;
    }
    
    selectedToken.element.style.left = `${selectedToken.x}px`;
    selectedToken.element.style.top = `${selectedToken.y}px`;
  }
  
  // Modificar o evento keydown para incluir as setas
  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") {
      shiftPressed = true;
    }
    
    if (e.code === "Space") {
      if (isResizing || isRotating || isDraggingToken) return;
      
      spacePressed = true;
      container.classList.add("space-pressed");
      document.body.style.cursor = 'grab';
      
      document.querySelectorAll('.background-image').forEach(img => {
        img.classList.add('ignore-mouse');
      });
      
      if (desenhando) {
        currentPath = null;
        pathPoints = [];
        desenhando = false;
      }
      
      e.preventDefault();
    }

    // Mover token selecionado com as setas
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (!spacePressed && selectedToken) {
        e.preventDefault();
        moveSelectedTokenWithArrows(e.key);
      }
    }

    if (e.key.toLowerCase() === "g" && e.shiftKey) {
      offsetX = viewWidth / 2 - gridWidth / 2;
      offsetY = viewHeight / 2 - gridHeight / 2;
      scale = 1;
      updateGridPosition();
    }
  });
  
  // Adicionar evento de clique no grid para deselecionar token
  document.addEventListener("mousedown", (e) => {
    if (selectedToken && 
        !e.target.closest('.grid-token') && 
        !e.target.closest('.token-item')) {
      deselectToken();
    }
  });
  
  // Adicione esta linha no final do arquivo para inicializar o sistema de tokens
  initializeTokenSystem();
});