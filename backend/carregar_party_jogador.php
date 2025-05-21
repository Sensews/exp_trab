<?php
// Define o tipo de conteúdo como JSON e ativa erros do MySQLi com exceções
header('Content-Type: application/json; charset=utf-8');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inclui conexão com banco e controle de sessão
require_once("conexao.php");
require_once("time.php");

session_start();

// Obtém o ID do perfil da sessão
$id_perfil = $_SESSION['id_perfil'] ?? null;

// Verifica se o usuário está autenticado
if (!$id_perfil) {
    echo json_encode([
        'success' => false,
        'erro' => 'Perfil não autenticado.'
    ]);
    exit;
}

try {
    // 🔍 Consulta a party em que o usuário (jogador) está
    $sql = "SELECT p.*, m.nome AS nome_mapa 
            FROM party_membros pm
            JOIN party p ON pm.id_party = p.id
            LEFT JOIN mapas m ON p.id_mapa = m.id
            WHERE pm.id_perfil = ?";
    
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("i", $id_perfil);
    $stmt->execute();
    $res = $stmt->get_result();

    // Se não estiver em nenhuma party
    if ($res->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'erro' => 'Você ainda não está em nenhuma party.'
        ]);
        exit;
    }

  // Dados da party do usuário
    $party = $res->fetch_assoc();

    // 👥 Busca todos os membros da mesma party
    $sql_membros = "SELECT pf.nome, pm.status
                    FROM party_membros pm
                    JOIN perfil pf ON pm.id_perfil = pf.id_perfil
                    WHERE pm.id_party = ?";
    
    $stmt_membros = $conexao->prepare($sql_membros);
    $stmt_membros->bind_param("i", $party['id']);
    $stmt_membros->execute();
    $res_membros = $stmt_membros->get_result();

    // Monta lista de membros
    $membros = [];
    while ($row = $res_membros->fetch_assoc()) {
        $membros[] = $row;
    }

    // Retorna a party e os membros
    echo json_encode([
        'success' => true,
        'party' => $party,
        'membros' => $membros
    ]);
    
} catch (Exception $e) {
    // Erro na execução do processo
    echo json_encode([
        'success' => false,
        'erro' => 'Erro ao carregar party: ' . $e->getMessage()
    ]);
}
?>
