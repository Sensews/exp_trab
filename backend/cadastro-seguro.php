<?php
require_once 'SecureEndpoint.php';
require_once __DIR__ . '/vendor/autoload.php';
require_once 'env_decoder.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$endpoint = new SecureEndpoint();

try {
    // Recebe dados descriptografados
    $dados = $endpoint->receiveData();
    
    $nome = trim($dados['nome'] ?? '');
    $email = trim($dados['email'] ?? '');
    $telefone = trim($dados['telefone'] ?? '');
    $senha = $dados['senha'] ?? '';
    $confirma = $dados['confirmar-senha'] ?? '';

    if ($senha !== $confirma) {
        $endpoint->sendData([
            "success" => false,
            "message" => "As senhas não coincidem."
        ]);
        exit;
    }

    // ... resto da lógica de cadastro igual ao arquivo original ...
    
    $conn = new mysqli("localhost", "root", "", "oblivion");
    if ($conn->connect_error) {
        $endpoint->sendData([
            "success" => false,
            "message" => "Erro na conexão com o banco de dados."
        ]);
        exit;
    }

    // Validações e inserção no banco...
    // ... código igual ao cadastro.php original ...

    // Resposta criptografada
    $endpoint->sendData([
        "success" => true,
        "message" => "Cadastro realizado com sucesso!"
    ]);

} catch (Exception $e) {
    $endpoint->sendData([
        "success" => false,
        "message" => "Erro no servidor: " . $e->getMessage()
    ]);
}