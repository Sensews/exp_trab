<?php
header('Content-Type: application/json'); // Sempre retorna JSON
require_once("conexao.php");
require_once("time.php"); // Já inicia a sessão e valida login

// Obtém o ID do usuário da sessão
$id_usuario = $_SESSION["id_usuario"] ?? null;
$action = $_GET["action"] ?? '';

// Se o usuário não estiver autenticado
if (!$id_usuario) {
    echo json_encode([
        "status" => "erro",
        "msg" => "Usuário não autenticado."
    ]);
    exit;
}

// === AÇÃO: carregar dados do perfil ===
if ($action === "carregar") {
    $sql = "SELECT * FROM perfil WHERE id_usuario = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();
    $perfil = $res->fetch_assoc();

    echo json_encode($perfil ?: []);
    exit;
}

// === AÇÃO: salvar alterações do perfil ===
if ($action === "salvar") {
    // Recebe os dados enviados em JSON
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["status" => "erro", "msg" => "Dados inválidos."]);
        exit;
    }

    $sql = "UPDATE perfil 
            SET nome = ?, arroba = ?, bio = ?, local = ?, aniversario = ?, avatar = ?, banner = ?, tipo = ? 
            WHERE id_usuario = ?";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param(
        "ssssssssi",
        $data["nome"],
        $data["arroba"],
        $data["bio"],
        $data["local"],
        $data["aniversario"],
        $data["avatar"],
        $data["banner"],
        $data["tipo"],
        $id_usuario
    );

    if ($stmt->execute()) {
        echo json_encode(["status" => "ok"]);
    } else {
        echo json_encode(["status" => "erro", "msg" => $stmt->error]);
    }

    exit;
}

// === AÇÃO: carregar posts do usuário ===
if ($action === "postsUsuario") {
    $sql = "SELECT texto, imagem, criado_em 
            FROM posts 
            WHERE id_perfil = (
                SELECT id_perfil FROM perfil WHERE id_usuario = ?
            )
            ORDER BY criado_em DESC";

    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();
    $res = $stmt->get_result();

    $posts = [];
    while ($row = $res->fetch_assoc()) {
        $posts[] = $row;
    }

    echo json_encode($posts);
    exit;
}

// === AÇÃO não reconhecida ===
echo json_encode(["status" => "erro", "msg" => "Ação inválida."]);
exit;
