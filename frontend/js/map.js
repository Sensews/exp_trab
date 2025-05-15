// CONFIGURAÇÃO INICIAL DO MAPA
document.addEventListener("DOMContentLoaded", () => {
  // Elementos principais e dimensões
  const container = document.getElementById("map-container");
  const grid = document.getElementById("grid");
  const gridWidth = 10000;
  const gridHeight = 10000;
  const viewWidth = container.offsetWidth;
  const viewHeight = container.offsetHeight;
  
  // Adicione esta constante de margem
  const gridMargin = 500; // Margem de segurança em pixels
  
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
  
  function updateGridPosition() {
    grid.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    
    // Também atualize os tokens para mantê-los alinhados ao grid
    tokens.forEach(token => {
      const element = token.element;
      if (element) {
        element.style.transformOrigin = 'top left';
      }
    });
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
      // Centralizar o grid com margens de segurança
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
  
    // Aplicar limites com margens de segurança
    const minX = viewWidth - (gridWidth + gridMargin) * scale;
    const maxX = gridMargin * scale;
    const minY = viewHeight - (gridHeight + gridMargin) * scale;
    const maxY = gridMargin * scale;
    
    offsetX = clamp(offsetX + dx, minX, maxX);
    offsetY = clamp(offsetY + dy, minY, maxY);
  
    updateGridPosition();
  });
  
  // ZOOM COM RODA DO MOUSE
  container.addEventListener("wheel", (e) => {
    if (spacePressed) return;
    e.preventDefault();

    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 : -1;
    
    const newScale = clamp(scale * (1 + delta * zoomIntensity), 0.5, 3);
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const mouseXInGrid = (mouseX - offsetX) / scale;
    const mouseYInGrid = (mouseY - offsetY) / scale;
    
    offsetX = mouseX - mouseXInGrid * newScale;
    offsetY = mouseY - mouseYInGrid * newScale;
    
    scale = newScale;
    
    updateGridPosition();
    ensureGridVisibility(); // Verificar a visibilidade após o zoom
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
  
  // GERENCIAMENTO DE TOKENS
  function updateTokenMenu() {
    // Adicionar botão de fechar ao tokenMenu
    const tokenMenu = document.getElementById('tokenMenu');
    
    // Verificar se já existe um botão de fechar
    if (!tokenMenu.querySelector('.token-close-btn')) {
      // Criar div de cabeçalho com título e botão de fechar
      const headerDiv = document.createElement('div');
      headerDiv.className = 'token-header';
      
      // Mover o título existente para esta div
      const title = tokenMenu.querySelector('h3');
      if (title) {
        const titleClone = title.cloneNode(true);
        headerDiv.appendChild(titleClone);
        
        // Criar botão de fechar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'token-close-btn';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.title = 'Fechar';
        headerDiv.appendChild(closeBtn);
        
        // Substituir o título original pelo novo header
        tokenMenu.replaceChild(headerDiv, title);
        
        // Adicionar evento de clique ao botão fechar
        closeBtn.addEventListener('click', () => {
          tokenMenu.classList.add('hidden');
        });
      }
    }
  }

  function addTokenToLibrary(token) {
    const tokenLibraryElement = document.getElementById('tokenLibrary');
    
    if (!tokenLibraryElement) {
      console.error("Elemento da biblioteca de tokens não encontrado!");
      return;
    }
    
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
      dragToken.style.left = `${e.clientX - dragToken.offsetWidth / 2}px`;
      dragToken.style.top = `${e.clientY - dragToken.offsetHeight / 2}px`;
      
      // Mover com o mouse
      const moveHandler = (moveEvent) => {
        dragToken.style.left = `${moveEvent.clientX - dragToken.offsetWidth / 2}px`;
        dragToken.style.top = `${moveEvent.clientY - dragToken.offsetHeight / 2}px`;
      };
      
      // Soltar o token
      const upHandler = (upEvent) => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        // Calcular a posição no grid
        const rect = grid.getBoundingClientRect();
        
        // Verificar se o token está sobre o grid
        if (upEvent.clientX >= rect.left && upEvent.clientX <= rect.right &&
            upEvent.clientY >= rect.top && upEvent.clientY <= rect.bottom) {
              
          // 1. Calcular posição do mouse em relação à viewport
          const mouseX = upEvent.clientX;
          const mouseY = upEvent.clientY;
          
          // 2. Obter deslocamento atual do grid
          const gridRect = grid.getBoundingClientRect();
          
          // 3. Converter para coordenadas do grid considerando escala e transformação
          const gridX = (mouseX - gridRect.left) / scale;
          const gridY = (mouseY - gridRect.top) / scale;
          
          // 4. Ajustar à grade
          const cellSize = 50;
          const snappedX = Math.round(gridX / cellSize) * cellSize;
          const snappedY = Math.round(gridY / cellSize) * cellSize;
          
          // Log para debug
          console.log('Mouse:', mouseX, mouseY);
          console.log('Grid rect:', gridRect.left, gridRect.top);
          console.log('Grid coords:', gridX, gridY);
          console.log('Snapped:', snappedX, snappedY);
          
          addTokenToGrid(token, snappedX, snappedY);
        }
        
        // Remover o elemento temporário
        dragToken.remove();
      };
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    });
    
    // Adicionar o token à biblioteca
    tokenLibraryElement.appendChild(tokenElement);
    
    // Log para depuração
    console.log(`Token adicionado à biblioteca: ${token.id}, tamanho: ${token.size}x${token.size}`);
  }

  function addTokenToGrid(tokenData, x, y) {
    const tokenElement = document.createElement('div');
    tokenElement.className = 'grid-token';
    tokenElement.style.backgroundImage = `url(${tokenData.url})`;
    
    const cellSize = 50;
    tokenElement.style.width = `${tokenData.size * cellSize}px`;
    tokenElement.style.height = `${tokenData.size * cellSize}px`;
    
    // CORREÇÃO: Posicionar o token exatamente nas coordenadas do grid
    tokenElement.style.position = 'absolute';
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
    
    // IMPORTANTE: Adicionar o token diretamente ao grid com z-index adequado
    tokenElement.style.zIndex = "5"; // Acima do grid, abaixo dos controles
    grid.appendChild(tokenElement);
    tokens.push(token);
    selectToken(token);
  }

  function selectToken(token) {
    // Deselecionar token atual e imagem atual
    deselectImage();
    
    if (selectedToken) {
      selectedToken.element.classList.remove('selected');
    }
    
    // Selecionar novo token
    selectedToken = token;
    selectedToken.element.classList.add('selected');
  }

  function deselectToken() {
    if (selectedToken) {
      selectedToken.element.classList.remove('selected');
      selectedToken = null;
    }
  }

  function startDragToken(e) {
    if (!selectedToken) return;
    
    isDraggingToken = true;
    tokenDragStartX = e.clientX;
    tokenDragStartY = e.clientY;
    
    document.addEventListener('mousemove', dragToken);
    document.addEventListener('mouseup', stopDragToken);
  }

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

  function stopDragToken() {
    isDraggingToken = false;
    document.removeEventListener('mousemove', dragToken);
    document.removeEventListener('mouseup', stopDragToken);
  }

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

  function initializeTokenSystem() {
    console.log("Inicializando sistema de tokens");
    
    const addTokenBtn = document.getElementById('addTokenBtn');
    const tokenMenu = document.getElementById('tokenMenu');
    const tokenInput = document.getElementById('tokenInput');
    const confirmTokenBtn = document.getElementById('confirmTokenBtn');
    const tokenLibraryElement = document.getElementById('tokenLibrary');
    const tokenSizeSelector = document.getElementById('tokenSizeSelector');
    
    if (!addTokenBtn || !tokenMenu || !tokenInput || !confirmTokenBtn || !tokenLibraryElement || !tokenSizeSelector) {
      console.error("Elementos necessários para o sistema de tokens não encontrados!");
      console.log({
        addTokenBtn, 
        tokenMenu, 
        tokenInput, 
        confirmTokenBtn, 
        tokenLibraryElement, 
        tokenSizeSelector
      });
      return;
    }
    
    // Atualizar o menu para adicionar o botão de fechar
    updateTokenMenu();
    
    // Mostrar menu de tokens ao clicar no botão
    addTokenBtn.addEventListener('click', () => {
      console.log("Botão de token clicado");
      tokenMenu.classList.remove('hidden');
    });
    
    // Adicionar token à biblioteca
    confirmTokenBtn.addEventListener('click', () => {
      console.log("Botão confirmar token clicado");
      if (tokenInput.files && tokenInput.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
          const tokenSize = parseInt(tokenSizeSelector.value);
          const newToken = {
            id: `token-${Date.now()}`,
            url: e.target.result,
            size: tokenSize
          };
          
          console.log(`Adicionando novo token: tamanho ${tokenSize}x${tokenSize}`);
          tokenLibrary.push(newToken);
          addTokenToLibrary(newToken);
          
          // Limpar input
          tokenInput.value = '';
        };
        
        reader.readAsDataURL(tokenInput.files[0]);
      } else {
        console.log("Nenhum arquivo selecionado");
      }
    });
  }
  
  // Remova a chamada duplicada de DOMContentLoaded e chame o initializeTokenSystem no mesmo contexto principal

  // No final do seu DOMContentLoaded principal, adicione:
  initializeTokenSystem();

  // Adicione um ouvinte de evento para o mousedown para deselecionar tokens
  document.addEventListener("mousedown", (e) => {
    if (selectedToken && 
        !e.target.closest('.grid-token') && 
        !e.target.closest('.token-item')) {
      deselectToken();
    }
  });
});

// Adicione estas constantes no início do seu código
const gridMargin = 500; // Margem de segurança em pixels
const maxPan = 1000;    // Limite máximo de panorâmica além das bordas

// Modifique a inicialização do grid para centralizar com margem
function initializeGrid() {
  // Centralizar inicialmente o grid com margens
  offsetX = viewWidth / 2 - gridWidth / 2;
  offsetY = viewHeight / 2 - gridHeight / 2;
  
  // Definir limites de navegação com margens
  updateGridPosition();
}

// Modifique a função updateGridPosition para aplicar transformação
function updateGridPosition() {
  grid.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  
  // Também atualize os tokens para mantê-los alinhados ao grid
  tokens.forEach(token => {
    const element = token.element;
    if (element) {
      element.style.transformOrigin = 'top left';
    }
  });
}

// Modifique o evento mousemove para incluir os limites com margem
document.addEventListener("mousemove", (e) => {
  if (!isDragging || !spacePressed) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;

  // Aplicar limites com margens de segurança
  const minX = viewWidth - (gridWidth + gridMargin) * scale;
  const maxX = gridMargin * scale;
  const minY = viewHeight - (gridHeight + gridMargin) * scale;
  const maxY = gridMargin * scale;
  
  offsetX = clamp(offsetX + dx, minX, maxX);
  offsetY = clamp(offsetY + dy, minY, maxY);

  updateGridPosition();
});

// Modifique o evento de reset (Shift+G) para incluir as margens
document.addEventListener("keydown", (e) => {
  // ... código existente ...
  
  if (e.key.toLowerCase() === "g" && e.shiftKey) {
    // Centralizar o grid com margens de segurança
    offsetX = viewWidth / 2 - gridWidth / 2;
    offsetY = viewHeight / 2 - gridHeight / 2;
    scale = 1;
    updateGridPosition();
  }
  
  // ... resto do código ...
});

// Adicione esta função para garantir que o grid permaneça visível
function ensureGridVisibility() {
  // Calcular as dimensões visíveis do grid
  const visibleWidth = gridWidth * scale;
  const visibleHeight = gridHeight * scale;
  
  // Verificar se o grid está muito fora da tela
  if (offsetX < -visibleWidth + gridMargin) {
    offsetX = -visibleWidth + gridMargin;
  }
  if (offsetX > viewWidth - gridMargin) {
    offsetX = viewWidth - gridMargin;
  }
  if (offsetY < -visibleHeight + gridMargin) {
    offsetY = -visibleHeight + gridMargin;
  }
  if (offsetY > viewHeight - gridMargin) {
    offsetY = viewHeight - gridMargin;
  }
  
  updateGridPosition();
}

// Modifique o evento de zoom para incluir essa verificação
container.addEventListener("wheel", (e) => {
  if (spacePressed) return;
  e.preventDefault();

  const zoomIntensity = 0.1;
  const delta = e.deltaY < 0 ? 1 : -1;
  
  const newScale = clamp(scale * (1 + delta * zoomIntensity), 0.5, 3);
  
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  
  const mouseXInGrid = (mouseX - offsetX) / scale;
  const mouseYInGrid = (mouseY - offsetY) / scale;
  
  offsetX = mouseX - mouseXInGrid * newScale;
  offsetY = mouseY - mouseYInGrid * newScale;
  
  scale = newScale;
  
  updateGridPosition();
  ensureGridVisibility(); // Verificar a visibilidade após o zoom
}, { passive: false });