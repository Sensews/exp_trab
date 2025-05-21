<?php
// Inclui a conexão com o banco de dados e verificação de sessão
require_once("conexao.php");
require_once("time.php");

// Inicia a sessão
session_start();

// Obtém o ID do usuário autenticado da sessão
$id_usuario = $_SESSION["id_usuario"] ?? null;

// Obtém a ação solicitada via GET
$action = $_GET["action"] ?? '';

// Verifica se o usuário está autenticado
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

    // Retorna os dados do perfil como JSON
    echo json_encode($res->fetch_assoc());
    exit;
}
