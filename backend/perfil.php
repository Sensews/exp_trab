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
