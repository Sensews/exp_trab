<?php
session_start();
require_once '../backend/conexao.php';

$id_usuario = $_SESSION['usuario_id'] ?? null;
$action = $_REQUEST['action'] ?? '';

// Protege acesso sem login
if (!$id_usuario) {
    http_response_code(403);
    echo json_encode(['erro' => 'Não autorizado']);
    exit;
}

// Carrega os dados do perfil
if ($action === 'carregar') {
    $sql = "SELECT nome, arroba, bio, local, aniversario, avatar, banner FROM perfil WHERE id_usuario = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se já existir, retorna
    if ($res->num_rows > 0) {
        echo json_encode($res->fetch_assoc());
    } else {
        // Caso contrário, cria um novo perfil vazio
        $stmt = $conexao->prepare("INSERT INTO perfil (id_usuario) VALUES (?)");
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();

        echo json_encode([
            "nome" => "Seu nome",
            "arroba" => "@seuarroba",
            "bio" => "Sua bio aqui",
            "local" => "Sua cidade",
            "aniversario" => "",
            "avatar" => "",
            "banner" => ""
        ]);
    }
    exit;
}

// Salva/atualiza dados do perfil
if ($action === 'salvar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Pega os dados enviados
    $nome = $_POST['nome'] ?? '';
    $arroba = '@' . ltrim($_POST['arroba'] ?? '', '@');
    $bio = $_POST['bio'] ?? '';
    $local = $_POST['local'] ?? '';
    $aniversario = $_POST['aniversario'] ?? '';
    $avatar = $_POST['avatar'] ?? '';
    $banner = $_POST['banner'] ?? '';

    // Atualiza no banco
    $sql = "UPDATE perfil SET nome=?, arroba=?, bio=?, local=?, aniversario=?, avatar=?, banner=? WHERE id_usuario=?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sssssssi", $nome, $arroba, $bio, $local, $aniversario, $avatar, $banner, $id_usuario);
    $stmt->execute();

    echo json_encode(["status" => "ok", "mensagem" => "Perfil atualizado com sucesso."]);
    exit;
}

// Se nenhuma ação válida foi recebida
http_response_code(400);
echo json_encode(['erro' => 'Ação inválida']);
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Perfil</title>

  <!-- Link style -->
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/burg.css">
  <link rel="stylesheet" href="css/perfil.css">
  <link rel="stylesheet" href="css/fotoperfil.css">

  <!-- Ícones  -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/loaders/GLTFLoader.js"></script>

    <!-- Scripts -->
  <script defer src="js/stars.js"></script>    
  <script defer src="js/perfil.js"></script> 
  <script defer src="js/burg_perfil.js"></script>
</head>

<body>
  <div class="page-wrapper">
    <header>
      <h1 class="logo" onclick="location.href='main.html'">OBLIVION</h1>

      <div class="nav-wrapper">
        <nav>
          <div class="dropdown">
            <button class="btn">Jogo</button>
            <div class="dropdown-content">
              <a href="fichas.html">Fichas</a>
              <a href="mapas.html">Mapas</a>
              <a href="anotacoes.html">Anotações</a>
            </div>
          </div>

          <button class="btn"><a href="comunidade.html">Comunidade</a></button>
          <button class="btn"><a href="anotacoes.html">Anotações</a></button>
        </nav>

       <!-- Botão de perfil -->
        <a href="perfil.html" title="Perfil">
          <div class="profile-icon">
            <img id="iconHeader" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="Perfil">
          </div>
        </a>

        <!-- Botão do menu burg -->
        <button class="hamburger" id="hamburgerMenuMobile" aria-label="Abrir menu">☰</button>
      </div>
    </header>

    <!-- Navegação mobile do menu burg -->
    <nav class="mobile-nav">
      <a class="btn" href="main.html">Início</a>
      <a class="btn" href="fichas.html">Fichas</a>
      <a class="btn" href="mapas.html">Mapas</a>
      <a class="btn" href="anotacoes.html">Anotações</a>
      <a class="btn" href="comunidade.html">Comunidade</a>
    </nav>

    <!-- perfil -->
    <div class="container">
      <div class="banner" id="banner"></div>

      <!-- Imagem de avatar -->
      <div class="avatar-wrapper">
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" id="avatar" class="avatar">
      </div>

      <!-- Dados perfil -->
      <div class="profile">
        <div class="header">
          <div>
            <div class="name" id="nome">Seu nome</div>
            <div class="arroba" id="arroba">@seuarroba</div>
          </div>

          <!-- Botão para abrir de editar perfil -->
          <button class="edit-btn" onclick="abrirModal()">Editar perfil</button>
        </div>

        <!-- infommações perfil -->
        <div class="bio" id="bio">Sua bio aqui</div>
        <div class="info">
          <span class="info-location" id="local">Sua cidade</span>
          <span class="info-date" id="aniversario">Aniversário: DD/MM/AAAA</span>
        </div>
      </div>

      <!-- Exemplo de post -->
      <div class="post">
        <div class="arroba" id="arrobaPost">@seuarroba</div>
        <div class="text">Esse é um post de exemplo ✨</div>
      </div>
    </div>

    <!-- Modal de edição do perfil -->
    <div class="modal" id="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Editar perfil</h2>
          <button onclick="salvarPerfil()">Salvar</button>
        </div>

        <div class="modal-banner" id="modalBanner">
          <label for="inputBanner" class="banner-btn">📷</label>
          <input type="file" id="inputBanner" accept="image/*">
        </div>

        <div class="modal-avatar-wrapper">
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" id="modalAvatar">
          <label for="inputAvatar" class="avatar-btn">📷</label>
          <input type="file" id="inputAvatar" accept="image/*">
        </div>

        <!-- Formulário do editar perfil -->
        <form class="modal-form">
          <label>Nome <input type="text" id="inputNome" maxlength="30"></label>
          <label>Usuário <input type="text" id="inputArroba" maxlength="20"></label>

          <label for="inputBio">Bio</label>
          <textarea id="inputBio" maxlength="160"></textarea>
          <div class="contador-wrapper"><small id="contadorBio">0 / 160</small></div>

          <label>Localização <input type="text" id="inputLocal"></label>
          <label>Aniversário <input type="date" id="inputAniversario"></label>
        </form>
      </div>
    </div>

    <footer>
      <p>© 2025 Oblivion RPG - Todos os direitos reservados.</p>
    </footer>
  </div>
</body>
</html>
