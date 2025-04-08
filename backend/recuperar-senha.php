<?php
require_once __DIR__ . '/vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    die("Erro na conexão com o banco de dados.");
}

$usuario_input = $_POST['usuario'] ?? '';
if (empty($usuario_input)) {
    die("E-mail ou telefone é obrigatório.");
}

$possivel_telefone = preg_replace('/\D+/', '', $usuario_input);

if (filter_var($usuario_input, FILTER_VALIDATE_EMAIL)) {
    $query = "SELECT id, nome, email FROM usuarios WHERE email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $usuario_input);
} else {
    $query = "SELECT id, nome, email FROM usuarios WHERE REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', '') = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $possivel_telefone);
}

$stmt->execute();
$result = $stmt->get_result();
$usuario = $result->fetch_assoc();

if (!$usuario) {
    die("Usuário não encontrado com esse e-mail ou telefone.");
}

$token = bin2hex(random_bytes(32));
$expira_em = date('Y-m-d H:i:s', strtotime('+1 hour'));

$update = $conn->prepare("UPDATE usuarios SET token_recuperacao = ?, recuperacao_expira_em = ? WHERE id = ?");
$update->bind_param("ssi", $token, $expira_em, $usuario['id']);
$update->execute();

$reset_link = "http://localhost/exp_trab/backend/redefinir-senha.php?token=$token";

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->Port = 465;
    $mail->SMTPAuth = true;
    $mail->SMTPSecure = 'ssl';

    $mail->Username = $_ENV['EMAIL_USERNAME'];
    $mail->Password = $_ENV['EMAIL_PASSWORD'];
    $mail->setFrom('Oblivion@gmail.com', 'Oblivion RPG');
    $mail->addAddress($usuario['email'], $usuario['nome']);

    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';
    $mail->isHTML(true);
    $mail->Subject = 'Recuperação de Senha - Oblivion RPG';
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
        <h2>Recuperação de Senha</h2>
        <p>Olá, <strong>{$usuario['nome']}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Para continuar, clique no botão abaixo:</p>
        <a class='btn' href='$reset_link'>Redefinir Senha</a>
        <p style='margin-top: 30px; font-size: 14px; color: #999;'>Se você não solicitou isso, apenas ignore este e-mail.</p>
      </div>
    </body>
    </html>
    ";

    $mail->send();
    echo "Um e-mail foi enviado para <b>{$usuario['email']}</b> com o link de redefinição de senha.";
} catch (Exception $e) {
    echo "Erro ao enviar o e-mail: {$mail->ErrorInfo}";
}

$conn->close();
?>
