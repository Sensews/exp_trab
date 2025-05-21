<?php
// Define o tipo de resposta como JSON 
header('Content-Type: application/json; charset=utf-8');

// Ativa exceções para erros MySQLi
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inclui conexão com banco e verificação de sessão
require_once("conexao.php");
require_once("time.php");

// Inicia a sessão e verifica autenticação
session_start();
$id_perfil = $_SESSION['id_perfil'] ?? null;

if (!$id_perfil) {
    echo json_encode([
        "success" => false,
        "error" => "Perfil não autenticado"
    ]);
    exit;
}

// Recebe dados enviados via POST
$codigo    = $_POST['codigo']    ?? null;
$senha     = $_POST['senha']     ?? null;
$id_ficha  = $_POST['id_ficha']  ?? null;
$id_perfil = $_POST['id_perfil'] ?? null;

// Verifica se todos os dados foram recebidos corretamente
if (!$codigo || !$senha || !$id_ficha || !$id_perfil) {
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Dados incompletos.'
    ]);
    exit;
}

try {
    // Busca party correspondente ao código fornecido
    $sql = "SELECT * FROM party WHERE codigo = ?";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Party não encontrada.'
        ]);
        exit;
    }

    $party = $res->fetch_assoc();

    // Verifica se a senha está correta
    if ($party['senha'] !== $senha) {
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Senha incorreta.'
        ]);
        exit;
    }

    // Impede que o mestre entre como jogador
    if ((int)$party['id_mestre'] === (int)$id_perfil) {
        echo json_encode([
            'sucesso' => false,
            'erro' => 'O mestre já está na party.'
        ]);
        exit;
    }

    $id_party = $party['id'];

    // Verifica se o jogador já está na party
    $sqlCheck = "SELECT * FROM party_membros WHERE id_party = ? AND id_perfil = ?";
    $stmtCheck = $conexao->prepare($sqlCheck);
    $stmtCheck->bind_param("ii", $id_party, $id_perfil);
    $stmtCheck->execute();
    $resCheck = $stmtCheck->get_result();

    // Se ainda não for membro, insere o jogador
    if ($resCheck->num_rows === 0) {
        $sqlInsert = "INSERT INTO party_membros (id_party, id_perfil, status) VALUES (?, ?, 'ativo')";
        $stmtInsert = $conexao->prepare($sqlInsert);
        $stmtInsert->bind_param("ii", $id_party, $id_perfil);
        $stmtInsert->execute();
    }

    // Retorna sucesso
    echo json_encode([
        'sucesso'  => true,
        'mensagem' => 'Entrou na party com sucesso.',
        'id_party' => $id_party
    ]);

} catch (Exception $e) {
    // Em caso de erro no servidor
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Erro no servidor: ' . $e->getMessage()
    ]);
}
?>
