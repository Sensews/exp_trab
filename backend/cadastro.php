<?php
require_once __DIR__ . '/vendor/autoload.php'; // Carrega o autoloader do Composer
include_once __DIR__ . '/limpar_pendentes.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load(); // Carrega as variáveis do .env

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    die("Erro na conexão com o banco de dados.");
}

$nome = $_POST['nome'] ?? '';
$email = $_POST['email'] ?? '';
$telefone = $_POST['telefone'] ?? '';
$senha = $_POST['senha'] ?? '';
$confirma = $_POST['confirmar-senha'] ?? '';

if ($senha !== $confirma) {
    die("As senhas não coincidem.");
}

$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(400);
    echo "E-mail já cadastrado.";
    exit;
}
$stmt->close();

$senha_hash = password_hash($senha, PASSWORD_DEFAULT);
$token = bin2hex(random_bytes(32));

$stmt = $conn->prepare("INSERT INTO usuarios (nome, email, telefone, senha, confirmado, token_verificacao) VALUES (?, ?, ?, ?, 0, ?)");
if (!$stmt) {
    die("Erro interno ao preparar query.");
}
$stmt->bind_param("sssss", $nome, $email, $telefone, $senha_hash, $token);

if ($stmt->execute()) {
    $link = "http://localhost/exp_trab/backend/verificar.php?token=$token";

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->SMTPDebug = 0;
        $mail->Host = 'smtp.gmail.com';
        $mail->Port = 465;
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = 'ssl';
    
        $mail->Username = $_ENV['EMAIL_USERNAME'];
        $mail->Password = $_ENV['EMAIL_PASSWORD'];
        $mail->setFrom('Oblivion@gmail.com', 'Oblivion RPG');
        $mail->addAddress($email, $nome);
    
        // UTF-8 aqui!
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';
    
        $mail->isHTML(true);
        $mail->Subject = 'Confirmação de Cadastro - Oblivion';
        $mail->Body = "
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #121212;
              color: #e0e0e0;
              padding: 20px;
            }
            .container {
              background-color: #1e1e1e;
              padding: 20px;
              border-radius: 10px;
              border: 1px solid #00ffaa44;
              box-shadow: 0 0 15px rgba(0,255,170,0.2);
            }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              background-color: #00ffaa;
              color: #121212;
              border-radius: 5px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 20px;
            }
            .btn:hover {
              background-color: #00e699;
            }
          </style>
        </head>
        <body>
          <div class='container'>
            <h2>Bem-vindo ao <span style='color:#00ffaa;'>Oblivion RPG</span>!</h2>
            <p>Olá, <strong>$nome</strong>!</p>
            <p>Estamos quase lá... para concluir seu cadastro, basta confirmar seu e-mail clicando no botão abaixo:</p>
            <a class='btn' href='$link'>Confirmar Cadastro</a>
            <p style='margin-top: 30px; font-size: 14px; color: #999;'>Se você não realizou este cadastro, apenas ignore este e-mail.</p>
          </div>
        </body>
        </html>
        ";
    
        $mail->send();
        echo "Um e-mail foi enviado para <b>$email</b> com o link de confirmação.";
    } catch (Exception $e) {
        echo "Erro ao enviar o e-mail de verificação: {$mail->ErrorInfo}";
    }    
} else {
    echo "Erro ao cadastrar. Tente novamente.";
}

$conn->close();
?>
