<?php
// Define o tipo de resposta como JSON 
header('Content-Type: application/json; charset=utf-8');

// Configura o MySQLi para lançar exceções em caso de erro
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inicia a sessão antes de usar time.php
session_start();

// Inclui arquivos de conexão e verificação de sessão
require_once("conexao.php");
require_once("time.php");

// Verifica se o usuário está autenticado
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
    
    // Recupera os dados da party criada pelo mestre
    $party = $res->fetch_assoc();

    // 👥 Busca todos os membros que pertencem à party do mestre
    $sql_membros = "SELECT pf.nome, pm.status
                    FROM party_membros pm
                    JOIN perfil pf ON pm.id_perfil = pf.id_perfil
                    WHERE pm.id_party = ?";
    
    $stmt_membros = $conexao->prepare($sql_membros);
    $stmt_membros->bind_param("i", $party['id']);
    $stmt_membros->execute();
    $res_membros = $stmt_membros->get_result();

    // Monta o array com os dados dos membros
    $membros = [];
    while ($row = $res_membros->fetch_assoc()) {
        $membros[] = $row;
    }

    // Retorna a party e os membros associados
    echo json_encode([
        'success' => true,
        'party' => $party,
        'membros' => $membros
    ]);

} catch (Exception $e) {
    // Em caso de erro na execução da query ou conexão
    echo json_encode([
        'success' => false,
        'erro' => 'Erro ao carregar party: ' . $e->getMessage()
    ]);
}
?>
