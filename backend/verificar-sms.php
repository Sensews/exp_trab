<?php
session_start();
header('Content-Type: application/json');

$codigoRecebido = $_POST['codigo'] ?? '';

if (empty($codigoRecebido)) {
    echo json_encode(["status" => "erro", "mensagem" => "Código não fornecido."]);
    exit;
}

if (!isset($_SESSION['codigo_sms'])) {
    echo json_encode(["status" => "erro", "mensagem" => "Nenhum código foi enviado previamente."]);
    exit;
}

if ($codigoRecebido == $_SESSION['codigo_sms']) {
    unset($_SESSION['codigo_sms']);
    echo json_encode(["status" => "ok", "mensagem" => "Código verificado com sucesso."]);
} else {
    echo json_encode(["status" => "erro", "mensagem" => "Código incorreto."]);
}
