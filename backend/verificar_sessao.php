<?php
session_start();
header('Content-Type: application/json'); 

$tempo_maximo = 60 * 60 * 24 * 7; // 7 dias

// Verifica se a sessão está iniciada corretamente
if (!isset($_SESSION['id_perfil']) || !isset($_SESSION['momento_login'])) {
    echo json_encode(["logado" => false]);
    exit;
}

// Calcula tempo desde o login
$tempo_desde_login = time() - $_SESSION['momento_login'];

// Se passou do tempo máximo, encerra a sessão
if ($tempo_desde_login > $tempo_maximo) {
    session_unset();     // Limpa dados da sessão
    session_destroy();   // Encerra a sessão
    echo json_encode(["logado" => false]);
    exit;
}

// Sessão válida
echo json_encode(["logado" => true]);
