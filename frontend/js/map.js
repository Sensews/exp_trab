// Inicia tudo quando a página termina de carregar
document.addEventListener("DOMContentLoaded", () => {
  // Configurações básicas
  // Define o tamanho do grid e das variáveis principais
  // ====================================================
  const container = document.getElementById("map-container");
  const grid = document.getElementById("grid");
  const gridWidth = 2500;
  const gridHeight = 2500;
  const viewWidth = container.offsetWidth;
  const viewHeight = container.offsetHeight;
  
  // Variáveis para movimentação do mapa
  // Controla como o usuário navega pelo mapa
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let offsetX = viewWidth / 2 - gridWidth / 2;
  let offsetY = viewHeight / 2 - gridHeight / 2;
  let spacePressed = false;
  let scale = 1;
  let shiftPressed = false;
  
  // Variáveis para desenho
  // Permite criar linhas e desenhos no mapa
  const svgNamespace = "http://www.w3.org/2000/svg";
  let currentPath = null;
  let pathPoints = [];
  
  // Variáveis para imagens
  // Controla as imagens adicionadas como mapas ou fundos
  let nextZIndex = -1;
  let backgroundImages = [];
  let selectedImage = null;
  let isResizing = false;
  let isRotating = false;
  let resizeHandle = '';
  let startX, startY, startWidth, startHeight, startAngle, startRotation;
  
  // Variáveis para pincel
  // Permite desenhar à mão livre no mapa
  let pincelAtivo = false;
  let corSelecionada = "#ffffff";
  let espessura = 5;
  let desenhando = false;
  let lastDrawX = null;
  let lastDrawY = null;
  
  // Variáveis para tokens
  // Permite colocar e mover miniaturas de personagens no mapa
  let tokens = [];
  let centerViewAfterAddingImage = true;
  let tokenLibrary = [];
  let selectedToken = null;
  let isDraggingToken = false;
  let tokenDragStartX, tokenDragStartY;
  

  // Funções úteis
  // Pequenas funções usadas em vários lugares do código
  // ====================================================
  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }
  
  // Atualiza a posição do grid
  // Aplica o zoom e movimento quando o usuário navega
  function updateGridPosition() {
    // Usar transform translate com ponto de origem no centro
    // Importante: manter o -50%, -50% para centralizar via CSS
    grid.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`;
    
    // Atualizar tokens conforme a posição do grid
    tokens.forEach(token => {
      const element = token.element;
      if (element) {
        element.style.transformOrigin = 'center center';
      }
    });
  }
  
  // Mantém o grid visível
  // Evita que o usuário perca o grid de vista
  function ensureGridVisibility() {
    const scaledGridWidth = gridWidth * scale;
    const scaledGridHeight = gridHeight * scale;
    
    // Calcular corretamente os limites de navegação
    // Quando o grid é maior que a viewport
    if (scaledGridWidth > viewWidth || scaledGridHeight > viewHeight) {
      // Permitir uma navegação mais livre - menos limitações severas
      // Calcular quanto do grid deve ficar visível ao navegar
      const visibleWidth = Math.min(viewWidth * 0.8, scaledGridWidth * 0.8);
      const visibleHeight = Math.min(viewHeight * 0.8, scaledGridHeight * 0.8);
      
      // Limites mais flexíveis
      const minX = viewWidth - (scaledGridWidth - visibleWidth);
      const maxX = -visibleWidth;
      const minY = viewHeight - (scaledGridHeight - visibleHeight);
      const maxY = -visibleHeight;
      
      // Aplicar os limites de maneira mais suave
      if (offsetX < minX) offsetX = minX;
      if (offsetX > maxX) offsetX = maxX;
      if (offsetY < minY) offsetY = minY;
      if (offsetY > maxY) offsetY = maxY;
    } else {
      // Centralizar perfeitamente quando o grid é menor que a viewport
      offsetX = (viewWidth - scaledGridWidth) / 2;
      offsetY = (viewHeight - scaledGridHeight) / 2;
    }
    
    updateGridPosition();
  }

  // ====================================================
  // GERENCIAMENTO DE IMAGENS
  // Permite adicionar, mover, redimensionar e rotacionar imagens no mapa
  // ====================================================
  function addBackgroundImage(imageUrl) {
  const img = document.createElement('div');
  img.className = 'background-image';
  img.style.backgroundImage = `url(${imageUrl})`;
  img.style.backgroundSize = 'contain';
  img.style.backgroundRepeat = 'no-repeat';
  img.style.width = '300px';
  img.style.height = '300px';
  img.style.position = 'absolute';

  const centerX = gridWidth / 2;
  const centerY = gridHeight / 2;

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

  // ✅ SALVAR AUTOMATICAMENTE NO BANCO
  const imgData = {
    url: imageUrl,
    x: centerX,
    y: centerY,
    width: 300,
    height: 300,
    rotation: 0,
    zIndex: parseInt(img.style.zIndex),
    anchored: false
  };

  console.log("Chamando salvarImagemNoBanco:", imgData);

  salvarImagemNoBanco(imgData);

  // Removido o erro: centerViewAfterAddingImage indefinido
  // Se quiser centralizar o mapa depois, descomente abaixo:
  // resetGridPosition();
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
      if (spacePressed) return;
      
      const isAnchored = imgElement.dataset.anchored === 'true';
      
      if (isAnchored && !shiftPressed) return;
      
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
  
  // Organiza camadas de imagens
  // Permite enviar imagens para trás ou trazê-las para frente
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
  
  // Fixa ou libera imagens
  // Impede ou permite que uma imagem seja movida
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
  
  // Seleciona uma imagem
  // Mostra controles para editar a imagem selecionada
  function selectImage(imgElement) {
    deselectImage();
    
    selectedImage = imgElement;
    selectedImage.classList.add('selected');
    
    const controlsContainer = imgElement.querySelector('.image-controls-container');
    if (controlsContainer) {
      controlsContainer.style.display = 'block';
    }
  }
  
  // Remove seleção de imagem
  // Esconde os controles de edição
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
  
  // Exclui imagens
  // Remove uma imagem do grid
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
  
  // Começa a arrastar imagem
  // Permite mover imagens pelo mapa
  function startDragImage(e) {
    if (!selectedImage || isResizing || isRotating || spacePressed) return;
    
    startX = e.clientX;
    startY = e.clientY;
    
    grid.classList.add('editing-image');
    
    document.addEventListener('mousemove', dragImage);
    document.addEventListener('mouseup', stopDragImage);
  }
  
  // Arrasta a imagem
  // Atualiza a posição durante o movimento
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
  
  // Finaliza arrasto de imagem
  // Encerra o movimento da imagem
  function stopDragImage() {
    grid.classList.remove('editing-image');
    document.removeEventListener('mousemove', dragImage);
    document.removeEventListener('mouseup', stopDragImage);
  }
  
  // Obtém dados da imagem
  // Recupera informações sobre tamanho e posição
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
  
  // Atualiza dados da imagem
  // Salva as alterações feitas na imagem
  function updateImageData(imgElement, newData) {
    const index = backgroundImages.findIndex(item => item.element === imgElement);
    if (index !== -1) {
      backgroundImages[index] = {
        ...backgroundImages[index],
        ...newData
      };
    }
  }

  // Inicia redimensionamento
  // Começa a alterar o tamanho da imagem
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
  
  // Redimensiona a imagem
  // Altera o tamanho conforme o mouse se move
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
  
  // Finaliza redimensionamento
  // Encerra o ajuste de tamanho da imagem
  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resizeImage);
    document.removeEventListener('mouseup', stopResize);
  }
  
  // Inicia rotação
  // Começa a girar a imagem
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
  
  // Rotaciona a imagem
  // Gira a imagem conforme o mouse se move
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
  
  // Finaliza rotação
  // Encerra o giro da imagem
  function stopRotate() {
    isRotating = false;
    document.removeEventListener('mousemove', rotateImage);
    document.removeEventListener('mouseup', stopRotate);
  }

  // ====================================================
  // FERRAMENTAS DE DESENHO
  // Permite desenhar linhas e formas diretamente no mapa
  // ====================================================
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

  // ====================================================
  // SISTEMA DE TOKENS
  // Gerencia os tokens de personagens que podem ser colocados no mapa
  // ====================================================
  function updateTokenMenu() {
    const tokenMenu = document.getElementById('tokenMenu');
    
    if (!tokenMenu.querySelector('.token-close-btn')) {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'token-header';
      
      const title = tokenMenu.querySelector('h3');
      if (title) {
        const titleClone = title.cloneNode(true);
        headerDiv.appendChild(titleClone);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'token-close-btn';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.title = 'Fechar';
        headerDiv.appendChild(closeBtn);
        
        tokenMenu.replaceChild(headerDiv, title);
        
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
    tokenElement.tabIndex = 0; // Torna o elemento focável com teclado
    
    // Variável para controlar qual token da biblioteca está selecionado
    let selectedLibraryToken = null;
    
    // Adicionar função para selecionar um token na biblioteca
    function selectLibraryToken(element) {
      // Remover seleção anterior
      if (selectedLibraryToken) {
        selectedLibraryToken.classList.remove('library-selected');
      }
      
      // Aplicar nova seleção
      selectedLibraryToken = element;
      selectedLibraryToken.classList.add('library-selected');
    }
    
    // Função para excluir um token da biblioteca
    function deleteTokenFromLibrary(tokenId) {
      const index = tokenLibrary.findIndex(t => t.id === tokenId);
      if (index !== -1) {
        tokenLibrary.splice(index, 1);
        const tokenToRemove = document.querySelector(`.token-item[data-id="${tokenId}"]`);
        if (tokenToRemove) {
          tokenToRemove.remove();
        }
        selectedLibraryToken = null;
      }
    }
    
    // Evento de clique para selecionar o token
    tokenElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectLibraryToken(tokenElement);
    });
    
    // Evento de foco para selecionar o token quando usando Tab
    tokenElement.addEventListener('focus', () => {
      selectLibraryToken(tokenElement);
    });
    
    // Evento de teclado para detectar Delete
    tokenElement.addEventListener('keydown', (e) => {
      if (e.key === 'Delete') {
        e.preventDefault();
        deleteTokenFromLibrary(token.id);
      }
    });
    
    tokenElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Botão esquerdo do mouse
        e.preventDefault();
        
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
        
        dragToken.style.left = `${e.clientX - dragToken.offsetWidth / 2}px`;
        dragToken.style.top = `${e.clientY - dragToken.offsetHeight / 2}px`;
        
        const moveHandler = (moveEvent) => {
          dragToken.style.left = `${moveEvent.clientX - dragToken.offsetWidth / 2}px`;
          dragToken.style.top = `${moveEvent.clientY - dragToken.offsetHeight / 2}px`;
        };
        
        const upHandler = (upEvent) => {
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', upHandler);
          
          const rect = grid.getBoundingClientRect();
          
          if (upEvent.clientX >= rect.left && upEvent.clientX <= rect.right &&
              upEvent.clientY >= rect.top && upEvent.clientY <= rect.bottom) {
                
            const mouseX = upEvent.clientX;
            const mouseY = upEvent.clientY;
            
            const gridRect = grid.getBoundingClientRect();
            
            const gridX = (mouseX - gridRect.left) / scale;
            const gridY = (mouseY - gridRect.top) / scale;
            
            const cellSize = 50;
            const snappedX = Math.round(gridX / cellSize) * cellSize;
            const snappedY = Math.round(gridY / cellSize) * cellSize;
            
            addTokenToGrid(token, snappedX, snappedY);
          }
          
          dragToken.remove();
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
      }
    });
    
    tokenLibraryElement.appendChild(tokenElement);
  }

  // Coloca tokens no mapa
  // Adiciona miniaturas no grid de jogo
  function addTokenToGrid(tokenData, x, y) {
    const tokenElement = document.createElement('div');
    tokenElement.className = 'grid-token';
    tokenElement.style.backgroundImage = `url(${tokenData.url})`;
    
    const cellSize = 50;
    tokenElement.style.width = `${tokenData.size * cellSize}px`;
    tokenElement.style.height = `${tokenData.size * cellSize}px`;
    
    tokenElement.style.position = 'absolute';
    tokenElement.style.left = `${x}px`;
    tokenElement.style.top = `${y}px`;
    tokenElement.dataset.size = tokenData.size;
    
    const token = {
      id: `grid-token-${Date.now()}`,
      element: tokenElement,
      x: x,
      y: y,
      size: tokenData.size,
      url: tokenData.url
    };
    
    tokenElement.dataset.id = token.id;
    
    tokenElement.addEventListener('mousedown', (e) => {
      if (spacePressed) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      selectToken(token);
      
      if (e.button === 0) {
        startDragToken(e);
      }
    });
    
    tokenElement.style.zIndex = "5";
    grid.appendChild(tokenElement);
    tokens.push(token);
    selectToken(token);
  }

  // Exclui token selecionado
  // Remove um token do mapa
  function deleteSelectedToken() {
    if (!selectedToken) return;
    
    const index = tokens.findIndex(token => token.id === selectedToken.id);
    if (index !== -1) {
      tokens.splice(index, 1);
    }
    
    selectedToken.element.remove();
    
    selectedToken = null;
  }

  // Seleciona um token
  // Mostra qual token está ativo
  function selectToken(token) {
    deselectImage();
    
    if (selectedToken) {
      selectedToken.element.classList.remove('selected');
    }
    
    selectedToken = token;
    selectedToken.element.classList.add('selected');
  }

  // Remove seleção de token
  // Desativa o token atual
  function deselectToken() {
    if (selectedToken) {
      selectedToken.element.classList.remove('selected');
      selectedToken = null;
    }
  }

  // Move token com teclas de seta
  // Permite ajustar posição com o teclado
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

  // ====================================================
  // NAVEGAÇÃO DO MAPA
  // Controla zoom, deslocamento e interação com o mapa
  // ====================================================
  container.addEventListener("wheel", (e) => {
    if (spacePressed) return;
    e.preventDefault();

    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 : -1;
    
    // Limitar o zoom entre 0.5 e 3
    const newScale = clamp(scale * (1 + delta * zoomIntensity), 0.5, 3);
    
    // Ajustar a escala
    scale = newScale;
    
    // Atualizar a posição do grid com a nova escala
    updateGridPosition();
  }, { passive: false });
  
  container.addEventListener("mousedown", (e) => {
    // Verificação mais rigorosa - o espaço deve estar pressionado antes de iniciar o arrasto
    if (!spacePressed) {
      return;
    }
    
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
  });
  
  // Substitua o event listener de mousemove para garantir que o grid só seja movido quando o espaço estiver pressionado
  document.addEventListener("mousemove", (e) => {
    // Verificação mais rigorosa - ambas as condições devem ser verdadeiras
    if (!(isDragging && spacePressed)) {
      return;
    }

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Remove as restrições severas e aplica o movimento com mais liberdade
    offsetX += dx;
    offsetY += dy;

    // Verificar a visibilidade apenas após o movimento
    updateGridPosition();
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

  // ====================================================
  // EVENTOS DE TECLADO
  // Controla todos os atalhos de teclado do mapa
  // ====================================================
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

    // Verificar se a tecla Delete foi pressionada e há um token selecionado
    if (e.key === "Delete" && selectedToken) {
      e.preventDefault();
      deleteSelectedToken();
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (!spacePressed && selectedToken) {
        e.preventDefault();
        moveSelectedTokenWithArrows(e.key);
      }
    }

    if (e.key.toLowerCase() === "g" && e.shiftKey) {
      resetGridPosition();
    }
  });
  
  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") {
      shiftPressed = false;
    }
    
    if (e.code === "Space") {
      spacePressed = false;
      isDragging = false; // Também desativar o arrasto quando soltar o espaço
      container.classList.remove("space-pressed");
      document.body.style.cursor = '';
      
      document.querySelectorAll('.background-image').forEach(img => {
        img.classList.remove('ignore-mouse');
      });
    }
  });
  
  // Centraliza o grid
  // Retorna o mapa para a posição padrão
  function resetGridPosition() {
    // Redefinir escala para 1
    scale = 1;
    
    // Ajustar o offset para centralizar o grid
    // Redefinir para 0,0 porque já centralizamos via CSS
    offsetX = 0;
    offsetY = 0;
    
    // Aplicar as alterações
    grid.style.transform = `translate(-50%, -50%) scale(${scale})`;
    
    console.log("Grid centralizado:", { offsetX, offsetY, scale });
  }
  
  // Inicialização do grid
  // Configura a posição inicial do mapa
  resetGridPosition();
  
  // ====================================================
  // EVENTOS DE DESENHO
  // Detecta e processa os eventos de desenho no mapa
  // ====================================================
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

  // ====================================================
  // INTERFACE DE USUÁRIO
  // Configura e gerencia os botões da interface
  // ====================================================
  updateGridPosition();
  
  // Primeiro identifique corretamente cada botão
  const fabToggle = document.getElementById("fabToggle");
  const fabButtons = document.getElementById("fabButtons");
  
  // Controle do menu principal (FAB)
  fabToggle.addEventListener("click", () => {
    fabButtons.classList.toggle("show");
  });
  
  // Controles de pincel - usando o primeiro botão do fabButtons
  const pincelBtn = document.querySelector('.fab-buttons button:nth-child(1)');
  const pincelMenu = document.getElementById('pincelMenu');
  const corButtons = document.querySelectorAll('.cor');
  const espessuraInput = document.getElementById('espessura');
  const borrachaBtn = document.getElementById('borrachaBtn');
  
  pincelBtn.addEventListener("click", () => {
    pincelAtivo = !pincelAtivo;
    pincelMenu.classList.toggle("hidden", !pincelAtivo);
    
    // Esconder outros menus ao abrir este
    imageMenu.classList.add("hidden");
    tokenMenu.classList.add("hidden");
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
  
  // Menu de imagens - usando o SEGUNDO botão (e não o terceiro como estava antes)
  const addImageBtn = document.getElementById('addImageBtn'); // Use ID em vez de seletor de posição
  const imageMenu = document.getElementById('imageMenu');
  const imageInput = document.getElementById('imageInput');
  const confirmImageBtn = document.getElementById('confirmImageBtn');
  const cancelImageBtn = document.getElementById('cancelImageBtn');
  
  addImageBtn.addEventListener('click', () => {
    console.log("Botão de adicionar imagem clicado");
    imageMenu.classList.remove('hidden');
    
    // Esconder outros menus ao abrir este
    pincelMenu.classList.add("hidden");
    tokenMenu.classList.add("hidden");
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

  // ====================================================
  // INICIALIZAÇÃO DO SISTEMA DE TOKENS
  // Configura e inicializa o sistema de tokens
  // ====================================================
  function initializeTokenSystem() {
    const addTokenBtn = document.getElementById('addTokenBtn');
    const tokenMenu = document.getElementById('tokenMenu');
    const tokenInput = document.getElementById('tokenInput');
    const confirmTokenBtn = document.getElementById('confirmTokenBtn');
    const tokenLibraryElement = document.getElementById('tokenLibrary');
    const tokenSizeSelector = document.getElementById('tokenSizeSelector');
    
    if (!addTokenBtn || !tokenMenu || !tokenInput || !confirmTokenBtn || !tokenLibraryElement || !tokenSizeSelector) {
      return;
    }
    
    updateTokenMenu();
    
    addTokenBtn.addEventListener('click', () => {
      tokenMenu.classList.remove('hidden');
    });
    
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
          
          tokenInput.value = '';
        };
        
        reader.readAsDataURL(tokenInput.files[0]);
      }
    });
  }
  
  // Ativa sistema de tokens
  // Carrega a funcionalidade de tokens
  initializeTokenSystem();

  // Deselecionar elementos ao clicar fora
  document.addEventListener("mousedown", (e) => {
    if (selectedImage && 
        !e.target.closest('.background-image') && 
        !e.target.closest('.image-controls-container')) {
      deselectImage();
    }
    
    if (selectedToken && 
        !e.target.closest('.grid-token') && 
        !e.target.closest('.token-item')) {
      deselectToken();
    }
  });
});


// ============================================
// Integração com o PHP - Salvamento e Carregamento
// ============================================

function salvarImagemNoBanco(imgData, idMapa = 1) {
  const dados = {
    action: "salvarImagem",
    id_mapa: idMapa,
    url: imgData.url,
    x: imgData.x,
    y: imgData.y,
    largura: imgData.width,
    altura: imgData.height,
    rotacao: imgData.rotation,
    z_index: imgData.zIndex,
    trancada: imgData.anchored ? 1 : 0
  };

  window.secureFetch.securePost("../backend/map-seguro.php", dados)
    .then(data => {
      console.log("Resposta do PHP ao salvar imagem:", data);
    })
    .catch(error => {
      console.error("Erro ao salvar imagem:", error);
    });
}


function carregarDadosIniciais() {
  // Imagens
  fetch("../backend/map.php?action=carregarImagens&id_mapa=1")
    .then(res => res.json())
    .then(imagens => {
      imagens.forEach(img => {
        addBackgroundImage(img.url);
        let data = backgroundImages[backgroundImages.length - 1];
        data.x = img.posicao_x;
        data.y = img.posicao_y;
        data.width = img.largura;
        data.height = img.altura;
        data.rotation = img.rotacao;
        data.zIndex = img.z_index;
      });
    });

  // Desenhos
  fetch("../backend/map.php?action=carregarDesenhos&id_mapa=1")
    .then(res => res.json())
    .then(desenhos => {
      desenhos.forEach(d => {
        const svg = document.createElementNS(svgNamespace, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.pointerEvents = "none";
        svg.classList.add("drawing-svg");

        const path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("d", d.path_data);
        path.setAttribute("stroke", d.cor);
        path.setAttribute("stroke-width", d.espessura);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");

        svg.appendChild(path);
        grid.appendChild(svg);
      });
    });

  // Tokens no mapa
  fetch("../backend/map.php?action=carregarTokensMapa&id_mapa=1")
    .then(res => res.json())
    .then(tokens => {
      tokens.forEach(t => {
        addTokenToGrid(t, t.posicao_x, t.posicao_y);
      });
    });

  // Tokens da biblioteca
  fetch("../backend/map.php?action=carregarBibliotecaTokens")
    .then(res => res.json())
    .then(tokens => {
      tokens.forEach(token => {
        tokenLibrary.push({
          id: token.id,
          url: token.url,
          size: token.tamanho
        });
        addTokenToLibrary(token);
      });
    });
}

// Adicionar chamada ao carregar tudo
document.addEventListener("DOMContentLoaded", () => {
  carregarDadosIniciais();
});


function salvarDesenho() {
  if (pathPoints.length > 1) {
    fetch("../backend/map.php?action=salvarDesenho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_mapa: 1,
        path_data: pathPoints.join(" "),
        cor: corSelecionada,
        espessura: espessura
      })
    });
  }
}

function salvarTokenMapa(tokenData, x, y) {
  fetch("../backend/map.php?action=salvarToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_mapa: 1,
      id_token_biblioteca: tokenData.id,
      url: tokenData.url,
      x: x,
      y: y,
      tamanho: tokenData.size
    })
  });
}

function salvarTokenBiblioteca(newToken) {
  fetch("../backend/map.php?action=salvarTokenBiblioteca", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: newToken.url,
      nome: newToken.id,
      tamanho: newToken.size
    })
  });
}