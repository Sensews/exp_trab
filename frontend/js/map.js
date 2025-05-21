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
  