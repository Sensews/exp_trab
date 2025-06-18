<?php
header('Content-Type: application/json');
session_start();
require_once("conexao.php");
include_once 'time.php';

// Verifica se o usuário está logado 
if (!isset($_SESSION['id_perfil'])) {
    echo json_encode(["logado" => false]);
    exit;
}

// Recupera o ID do perfil logado
$id_perfil = $_SESSION['id_perfil'];

try {
    // Verifica se esse perfil é mestre de alguma party
    $stmt = $conexao->prepare("SELECT id FROM party WHERE id_mestre = ?");
    $stmt->bind_param("i", $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se não for mestre de nenhuma party, retorna erro
    if ($res->num_rows === 0) {
        echo json_encode([
            "status" => "erro",
            "msg" => "Você não possui uma party para excluir."
        ]);
        exit;
    }

    // Armazena o ID da party encontrada
    $party = $res->fetch_assoc();
    $id_party = $party['id'];

    // Exclui todos os membros da party
    $stmt = $conexao->prepare("DELETE FROM party_membros WHERE id_party = ?");
    $stmt->bind_param("i", $id_party);
    $stmt->execute();

    // Exclui a própria party
    $stmt = $conexao->prepare("DELETE FROM party WHERE id = ?");
    $stmt->bind_param("i", $id_party);
    $stmt->execute();

    // Retorna sucesso
    echo json_encode([
        "status" => "ok",
        "msg" => "Party excluída com sucesso."
    ]);

} catch (Exception $e) {
    // Retorna erro caso alguma exceção ocorra
    echo json_encode([
        "status" => "erro",
        "msg" => "Erro ao excluir a party: " . $e->getMessage()
    ]);
} finally {
    // Fecha a conexão com o banco de dados
    $conexao->close();
}
