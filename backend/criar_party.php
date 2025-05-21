<?php
// Define o tipo de retorno como JSON
header('Content-Type: application/json');

// Ativa exceções para erros do MySQLi
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Inclui arquivos essenciais
require_once("conexao.php");
require_once("time.php");

// Inicia a sessão e valida se o usuário está autenticado
session_start();
$id_perfil = $_SESSION['id_perfil'] ?? null;

if (!$id_perfil) {
    echo json_encode(["sucesso" => false, "erro" => "Perfil não autenticado"]);
    exit;
}

// Função para enviar resposta JSON e encerrar conexão
function responder($array) {
    global $conexao;
    echo json_encode($array);
    $conexao->close();
    exit;
}

// Função que gera um código único para a party
function gerarCodigoUnico($conexao, $tamanho = 6) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    do {
        $codigo = '';
        for ($i = 0; $i < $tamanho; $i++) {
            $codigo .= $chars[random_int(0, strlen($chars) - 1)];
        }

        $stmt = $conexao->prepare("SELECT id FROM party WHERE codigo = ?");
        $stmt->bind_param("s", $codigo);
        $stmt->execute();
        $res = $stmt->get_result();
    } while ($res->num_rows > 0); // Garante que não gere código repetido

    return $codigo;
}