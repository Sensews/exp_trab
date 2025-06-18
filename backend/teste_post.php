<?php
// Inicia sessão e depois carrega time.php (ordem correta!)
session_start();
require_once("time.php");

// Carrega conexão com o banco
require_once("conexao.php");

// Exibe erros para debug (em produção, remova)
ini_set("display_errors", 1);
error_reporting(E_ALL);

// Verificação padronizada de sessão
if (!isset($_SESSION["id_usuario"])) {
    echo json_encode(["logado" => false]);
    exit;
}

// Verifica autenticação
$id_perfil = $_SESSION['id_perfil'] ?? null;

if (!$id_perfil) {
    echo json_encode(["erro" => "Perfil não autenticado."]);
    exit;
}

// Verificação redundante: consulta novamente o id_perfil a partir de id_usuario
$sqlPerfil = "SELECT id_perfil FROM perfil WHERE id_usuario = ?";
$id_usuario = $_SESSION['id_usuario'] ?? null; 
$stmt = $conexao->prepare($sqlPerfil);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
    echo json_encode(["erro" => "Perfil não encontrado."]);
    exit;
}

$id_perfil = $row["id_perfil"];

// Ação recebida via GET ou POST
$action = $_REQUEST["action"] ?? "";

// === 1. Criar post ===
if ($action === "criarPost") {
    $texto = $_POST["texto"] ?? "";
    $imagem = "";

    // Verifica se uma imagem foi enviada
    if (isset($_FILES["imagem"]) && $_FILES["imagem"]["tmp_name"]) {
        $extensao = pathinfo($_FILES["imagem"]["name"], PATHINFO_EXTENSION);
        $nomeArquivo = uniqid("img_") . "." . $extensao;
        $caminhoFinal = "uploads/" . $nomeArquivo;

        // Move o arquivo para a pasta final
        if (move_uploaded_file($_FILES["imagem"]["tmp_name"], $caminhoFinal)) {
            $imagem = $caminhoFinal;
        }
    }

    // Insere o post no banco
    $sql = "INSERT INTO posts (id_perfil, texto, imagem) VALUES (?, ?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("iss", $id_perfil, $texto, $imagem);
    $stmt->execute();

    $id = $stmt->insert_id;

    echo json_encode([
        "sucesso" => true,
        "id" => $id,
        "texto" => $texto,
        "imagem" => $imagem
    ]);
    exit;
}

// === 2. Carregar posts ===
if ($action === "carregarPosts") {
    $sql = "SELECT posts.id, posts.texto, posts.imagem, posts.criado_em, perfil.arroba, perfil.avatar 
            FROM posts 
            JOIN perfil ON posts.id_perfil = perfil.id_perfil 
            ORDER BY posts.id DESC";
    $res = $conexao->query($sql);

    $posts = [];
    while ($row = $res->fetch_assoc()) {
        $posts[] = $row;
    }

    echo json_encode($posts);
    exit;
}

// === 3. Comentar ===
if ($action === "comentar") {
    $id_post = intval($_POST["id_post"]);
    $comentario = $_POST["comentario"] ?? "";

    $sql = "INSERT INTO comentarios (id_perfil, id_post, texto) VALUES (?, ?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("iis", $id_perfil, $id_post, $comentario);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === 4. Curtir ===
if ($action === "curtir") {
    $id_post = intval($_POST["id_post"]);

    $sql = "INSERT IGNORE INTO curtidas_posts (id_perfil, id_post) VALUES (?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_perfil, $id_post);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === 5. Remover curtida ===
if ($action === "removerCurtida") {
    $id_post = intval($_POST["id_post"]);

    $sql = "DELETE FROM curtidas_posts WHERE id_perfil = ? AND id_post = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ii", $id_perfil, $id_post);
    $stmt->execute();

    echo json_encode(["sucesso" => true]);
    exit;
}

// === 6. Verificar curtida ===
if ($action === "verificarCurtida") {
    $id_post = intval($_GET["id_post"]);

    // Total de curtidas no post
    $sql1 = "SELECT COUNT(*) AS total FROM curtidas_posts WHERE id_post = ?";
    $stmt1 = $conexao->prepare($sql1);
    $stmt1->bind_param("i", $id_post);
    $stmt1->execute();
    $res1 = $stmt1->get_result();
    $total = $res1->fetch_assoc()["total"];

    // Se o usuário atual já curtiu o post
    $sql2 = "SELECT COUNT(*) AS curtido FROM curtidas_posts WHERE id_post = ? AND id_perfil = ?";
    $stmt2 = $conexao->prepare($sql2);
    $stmt2->bind_param("ii", $id_post, $id_perfil);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    $curtido = $res2->fetch_assoc()["curtido"] > 0;

    echo json_encode([
        "total" => $total,
        "curtido" => $curtido
    ]);
    exit;
}

// === Ação inválida ===
echo json_encode(["erro" => "Ação inválida."]);