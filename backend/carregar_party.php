<?php
// Define o tipo de resposta como JSON 
header('Content-Type: application/json; charset=utf-8');

// Configura o MySQLi para lançar exceções em caso de erro
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inclui arquivos de conexão e verificação de sessão
require_once("conexao.php");
require_once("time.php");

// Inicia a sessão e verifica se o usuário está autenticado
session_start();
$id_perfil = $_SESSION['id_perfil'] ?? null;

if (!$id_perfil) {
    echo json_encode([
        'success' => false,
        'erro' => 'Perfil não autenticado.'
    ]);
    exit;
}

try {
    // 🔍 Verifica se o perfil atual é mestre de alguma party
    $sql = "SELECT p.*, m.nome AS nome_mapa 
            FROM party p
            LEFT JOIN mapas m ON p.id_mapa = m.id
            WHERE p.id_mestre = ?";
    
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se não for mestre de nenhuma party, retorna erro
    if ($res->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'erro' => 'Você ainda não criou uma party.'
        ]);
        exit;
    }