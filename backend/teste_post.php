<?php
// Carrega conexão com o banco e verificação de sessão
require_once("conexao.php");
require_once("time.php");

// Exibe erros para debug (em produção, remova)
ini_set("display_errors", 1);
error_reporting(E_ALL);

// Inicia sessão e verifica autenticação
session_start();
$id_perfil = $_SESSION['id_perfil'] ?? null;

if (!$id_perfil) {
    echo json_encode(["erro" => "Perfil não autenticado."]);
    exit;
}

// 🔁 Verificação redundante: consulta novamente o id_perfil a partir de id_usuario
$sqlPerfil = "SELECT id_perfil FROM perfil WHERE id_usuario = ?";
$stmt = $conexao->prepare($sqlPerfil);
$stmt->bind_param("i", $id_usuario); // ⚠️ $id_usuario não foi definido na sessão
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


// === 2. Carregar posts (com arroba e avatar do autor) ===
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


// === 3. Comentar em um post ===
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