<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/env_decoder.php'; // Adiciona o decoder

use Twilio\Rest\Client;

header('Content-Type: application/json');
session_start();

// Carregamos as variáveis do .env normalmente para o ambiente,
// mas usaremos obter_env() para acessar seus valores reais
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

$codigo = rand(100000, 999999);
$_SESSION['codigo_sms'] = $codigo;

try {
    $sid = obter_env('ACCOUNT_SID');
    $token = obter_env('AUTH_TOKEN');
    $twilio_number = obter_env('TWILIO_PHONE_NUMBER');

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
