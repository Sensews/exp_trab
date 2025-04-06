<?php
require_once __DIR__ . '/vendor/autoload.php';

use Twilio\Rest\Client;

header('Content-Type: application/json');
session_start();

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
} catch (Exception $e) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro ao carregar .env: " . $e->getMessage()]);
    exit;
}

$telefone = $_POST['telefone'] ?? '';
if (empty($telefone)) {
    echo json_encode(["status" => "erro", "mensagem" => "Número de telefone não fornecido."]);
    exit;
}

// Gera código e salva
$codigo = rand(100000, 999999);
$_SESSION['codigo_sms'] = $codigo;

// Envia SMS
try {
    $sid = $_ENV['ACCOUNT_SID'];
    $token = $_ENV['AUTH_TOKEN'];
    $twilio_number = $_ENV['TWILIO_PHONE_NUMBER'];

    $client = new Client($sid, $token);

    $client->messages->create(
        "+55" . preg_replace('/\D/', '', $telefone),
        [
            'from' => $twilio_number,
            'body' => mb_convert_encoding("Seu código de verificação é: $codigo", 'UTF-8', 'auto')
        ]
    );

    echo json_encode(["status" => "ok", "mensagem" => "SMS enviado com sucesso."]);
} catch (Exception $e) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro ao enviar SMS: " . $e->getMessage()]);
}
