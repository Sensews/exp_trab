<?php
require_once __DIR__ . '/vendor/autoload.php';
include_once __DIR__ . '/limpar_pendentes.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once 'env_decoder.php';


$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    http_response_code(500);
    die("Erro na conexão com o banco de dados.");
}

$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$senha = $_POST['senha'] ?? '';
$confirma = $_POST['confirmar-senha'] ?? '';

if ($senha !== $confirma) {
    http_response_code(400);
    die("As senhas não coincidem.");
}

function verificar_forca_senha($senha) {
    $forca = 0;
    if (strlen($senha) >= 8) $forca++;
    if (preg_match('/[A-Z]/', $senha)) $forca++;
    if (preg_match('/[a-z]/', $senha)) $forca++;
    if (preg_match('/[0-9]/', $senha)) $forca++;
    if (preg_match('/[^A-Za-z0-9]/', $senha)) $forca++;

    if ($forca >= 5) return 'Muito forte';
    if ($forca >= 4) return 'Forte';
    if ($forca >= 3) return 'Moderada';
    if ($forca >= 2) return 'Fraca';
    return 'Muito fraca';
}

$forca_senha = verificar_forca_senha($senha);

if ($forca_senha !== 'Muito forte') {
    http_response_code(400);
    die("A senha não é forte o suficiente.");
}

$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(400);
    die("E-mail já cadastrado.");
}
$stmt->close();

$stmt = $conn->prepare("SELECT id FROM usuarios WHERE telefone = ?");
$stmt->bind_param("s", $telefone);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(400);
    die("Telefone já cadastrado.");
}
$stmt->close();

$senha_hash = password_hash($senha, PASSWORD_DEFAULT);
$token = bin2hex(random_bytes(32));

$stmt = $conn->prepare("INSERT INTO usuarios (nome, email, telefone, senha, confirmado, token_verificacao) VALUES (?, ?, ?, ?, 0, ?)");
if (!$stmt) {
    http_response_code(500);
    die("Erro interno ao preparar query.");
}
$stmt->bind_param("sssss", $nome, $email, $telefone, $senha_hash, $token);

if ($stmt->execute()) {
    // CRIAR PERFIL AUTOMATICAMENTE
    $id_usuario = $conn->insert_id;

    // Cria perfil sem arroba inicialmente
    $stmtPerfil = $conn->prepare("INSERT INTO perfil (id_usuario, nome, tipo) VALUES (?, ?, 'jogador')");
    $stmtPerfil->bind_param("is", $id_usuario, $nome);
    $stmtPerfil->execute();

    // Gera arroba com base no ID do perfil
    $id_perfil = $conn->insert_id;
    $stmtPerfil->close();

    $arroba = "oblivion" . $id_perfil;
    $stmtArroba = $conn->prepare("UPDATE perfil SET arroba = ? WHERE id_perfil = ?");
    $stmtArroba->bind_param("si", $arroba, $id_perfil);
    $stmtArroba->execute();
    $stmtArroba->close();

    // Envio de e-mail de verificação
    $link = "http://localhost/exp_trab/backend/verificar.php?token=$token";
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->SMTPDebug = 0;
        $mail->Host = 'smtp.gmail.com';
        $mail->Port = 465;
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = 'ssl';
        $mail->Username = obter_env('EMAIL_USERNAME');
        $mail->Password = obter_env('EMAIL_PASSWORD');
        $mail->setFrom('Oblivion@gmail.com', 'Oblivion RPG');
        $mail->addAddress($email, $nome);
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';
        $mail->isHTML(true);
        $mail->Subject = 'Confirmação de Cadastro - Oblivion';

        $mail->Body = "
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #121212; color: #e0e0e0; padding: 20px; }
            .container { background-color: #1e1e1e; padding: 20px; border-radius: 10px; border: 1px solid #00ffaa44; box-shadow: 0 0 15px rgba(0,255,170,0.2); }
            .btn { display: inline-block; padding: 10px 20px; background-color: #00ffaa; color: #121212; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .btn:hover { background-color: #00e699; }
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
        header("Location: ../frontend/cadastro.html?sucesso=1");
        exit();

    } catch (Exception $e) {
        http_response_code(500);
        die("Erro ao enviar o e-mail de verificação: {$mail->ErrorInfo}");
    }

} else {
    http_response_code(500);
    die("Erro ao cadastrar. Tente novamente.");
}

$conn->close();
