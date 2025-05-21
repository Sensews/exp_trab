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
