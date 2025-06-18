<?php
session_start();

// Verificação padronizada
if (!isset($_SESSION['id_perfil'])) {
    echo json_encode(["logado" => false]);
    exit;
}

// Limpa todos os dados da sessão
session_unset();
session_destroy();

// Retorna uma resposta JSON de sucesso
header('Content-Type: application/json');
echo json_encode(["status" => "ok", "msg" => "Logout realizado com sucesso."]);
