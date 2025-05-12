<?php
session_start();
require_once '../backend/conexao.php';

$id_usuario = $_SESSION['usuario_id'] ?? null;
$action = $_REQUEST['action'] ?? '';

// Proteções
if (!$id_usuario && $action) {
    http_response_code(403);
    echo "Usuário não autenticado.";
    exit;
}

if (!$id_usuario && !$action) {
    header("Location: login.html");
    exit;
}

function responder($data) {
    header("Content-Type: application/json");
    echo json_encode($data);
    exit;
}

// API via action
if ($action) {
    switch ($action) {
        case 'listar':
            $sql = "SELECT p.nome AS projeto, n.titulo FROM projetos p
                    LEFT JOIN notas n ON p.id = n.id_projeto
                    WHERE p.id_usuario = ? ORDER BY p.nome, n.titulo";
            $stmt = $conexao->prepare($sql);
            $stmt->bind_param("i", $id_usuario);
            $stmt->execute();
            $res = $stmt->get_result();
            $saida = [];
            while ($row = $res->fetch_assoc()) {
                $proj = $row['projeto'];
                if (!isset($saida[$proj])) $saida[$proj] = [];
                if ($row['titulo']) $saida[$proj][] = $row['titulo'];
            }
            responder($saida);

        case 'criar_projeto':
            $nome = trim($_POST['nome'] ?? '');
            if (!$nome) exit("Nome inválido.");
            $stmt = $conexao->prepare("INSERT IGNORE INTO projetos (id_usuario, nome) VALUES (?, ?)");
            $stmt->bind_param("is", $id_usuario, $nome);
            $stmt->execute();
            echo "Projeto criado.";
            break;

        case 'criar_nota':
            $projeto = trim($_POST['projeto'] ?? '');
            $nota = trim($_POST['nota'] ?? '');
            if (!$projeto || !$nota) exit("Dados incompletos.");
            $stmt = $conexao->prepare("SELECT id FROM projetos WHERE id_usuario = ? AND nome = ?");
            $stmt->bind_param("is", $id_usuario, $projeto);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();
            if ($row) {
                $id_projeto = $row['id'];
                $stmt = $conexao->prepare("INSERT IGNORE INTO notas (id_projeto, titulo, conteudo) VALUES (?, ?, '')");
                $stmt->bind_param("is", $id_projeto, $nota);
                $stmt->execute();
                echo "Nota criada.";
            } else {
                http_response_code(404); echo "Projeto não encontrado.";
            }
            break;

        case 'salvar_nota':
            $projeto = trim($_POST['projeto'] ?? '');
            $nota = trim($_POST['nota'] ?? '');
            $conteudo = $_POST['conteudo'] ?? '';
            $stmt = $conexao->prepare("SELECT id FROM projetos WHERE id_usuario = ? AND nome = ?");
            $stmt->bind_param("is", $id_usuario, $projeto);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();
            if ($row) {
                $id_projeto = $row['id'];
                $stmtOld = $conexao->prepare("SELECT conteudo FROM notas WHERE id_projeto = ? AND titulo = ?");
                $stmtOld->bind_param("is", $id_projeto, $nota);
                $stmtOld->execute();
                $resOld = $stmtOld->get_result();
                if ($old = $resOld->fetch_assoc()) {
                    $stmtBackup = $conexao->prepare("INSERT INTO versoes (id_projeto, titulo, conteudo) VALUES (?, ?, ?)");
                    $stmtBackup->bind_param("iss", $id_projeto, $nota, $old['conteudo']);
                    $stmtBackup->execute();
                }
                $stmt = $conexao->prepare("UPDATE notas SET conteudo = ? WHERE id_projeto = ? AND titulo = ?");
                $stmt->bind_param("sis", $conteudo, $id_projeto, $nota);
                $stmt->execute();
                echo "Salvo.";
            } else {
                http_response_code(404); echo "Projeto não encontrado.";
            }
            break;

        case 'carregar_nota':
            $projeto = trim($_GET['projeto'] ?? '');
            $nota = trim($_GET['nota'] ?? '');
            $stmt = $conexao->prepare("SELECT n.conteudo FROM notas n
                                       JOIN projetos p ON n.id_projeto = p.id
                                       WHERE p.id_usuario = ? AND p.nome = ? AND n.titulo = ?");
            $stmt->bind_param("iss", $id_usuario, $projeto, $nota);
            $stmt->execute();
            $res = $stmt->get_result();
            $row = $res->fetch_assoc();
            echo $row['conteudo'] ?? '';
            break;

        case 'excluir_nota':
            $projeto = trim($_POST['projeto'] ?? '');
            $nota = trim($_POST['nota'] ?? '');
            $stmt = $conexao->prepare("SELECT id FROM projetos WHERE id_usuario = ? AND nome = ?");
            $stmt->bind_param("is", $id_usuario, $projeto);
            $stmt->execute();
            $res = $stmt->get_result();
            $proj = $res->fetch_assoc();
            if ($proj) {
                $stmt = $conexao->prepare("DELETE FROM notas WHERE id_projeto = ? AND titulo = ?");
                $stmt->bind_param("is", $proj['id'], $nota);
                $stmt->execute();
                echo "Anotação excluída.";
            } else {
                http_response_code(404); echo "Projeto não encontrado.";
            }
            break;

        case 'excluir_projeto':
            $projeto = trim($_POST['projeto'] ?? '');
            $stmt = $conexao->prepare("DELETE FROM projetos WHERE id_usuario = ? AND nome = ?");
            $stmt->bind_param("is", $id_usuario, $projeto);
            $stmt->execute();
            echo "Projeto excluído.";
            break;

        case 'backup_versoes':
            $projeto = trim($_GET['projeto'] ?? '');
            $nota = trim($_GET['nota'] ?? '');
            $stmt = $conexao->prepare("SELECT v.conteudo, v.salvo_em FROM versoes v
                                       JOIN projetos p ON p.id = v.id_projeto
                                       WHERE p.nome = ? AND v.titulo = ? AND p.id_usuario = ?
                                       ORDER BY v.salvo_em DESC LIMIT 10");
            $stmt->bind_param("ssi", $projeto, $nota, $id_usuario);
            $stmt->execute();
            $res = $stmt->get_result();
            $versoes = [];
            while ($row = $res->fetch_assoc()) $versoes[] = $row;
            responder($versoes);
        
        default:
            http_response_code(400); echo "Ação inválida."; break;
    }
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Anotações</title>
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/anotacoes.css" />
  <link rel="stylesheet" href="css/burg.css" />
  <link rel="stylesheet" href="css/fotoperfil.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
  <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet" />
  <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
  <script src="js/stars.js"></script>
  <script src="js/anotacoes.js" defer></script>
  <script src="js/burg_perfil.js" defer></script>
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
            </div>
          </div>
          <button class="btn"><a href="comunidade.html">Comunidade</a></button>
        </nav>
        <a href="perfil.html" title="Perfil">
          <div class="profile-icon">
            <img id="iconHeader" src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" alt="Perfil">
          </div>
        </a>
        <button class="hamburger" id="hamburgerMenuMobile" aria-label="Abrir menu">☰</button>
      </div>
    </header>

    <nav class="mobile-nav">
      <a class="btn" href="main.html">Início</a>
      <a class="btn" href="fichas.html">Fichas</a>
      <a class="btn" href="mapas.html">Mapas</a>
      <a class="btn" href="anotacoes.php">Anotações</a>
      <a class="btn" href="comunidade.html">Comunidade</a>
    </nav>

    <main>
      <div class="content-box">
        <h2>Minhas Anotações</h2>
        <p>Coloque o título de sua sessão, escreva suas ideias e mantenha tudo organizado.</p>
        <div class="editor-box"><div id="editor-container"></div></div>
        <div class="btn-container">
          <button class="btn" onclick="salvarAnotacoes()">💾 Salvar</button>
          <button class="btn" onclick="exportarAnotacoes()">📤 Exportar</button>
          <button class="btn" onclick="limparAnotacoes()">🧹 Limpar</button>
        </div>
      </div>
    </main>

    <footer>
      <p>© 2025 Oblivion RPG - Todos os direitos reservados.</p>
    </footer>

    <button id="hamburgerProjetos" aria-label="Abrir menu de projetos">☰</button>
    <aside id="sidebarProjetos">
      <h3>📁 Meus Projetos</h3>
      <div id="projetosContainer"></div>
      <button class="btn btn-novo-projeto" onclick="criarProjeto()">➕ Novo Projeto</button>
    </aside>
  </div>
</body>
</html>
