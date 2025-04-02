<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

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

$senha_hash = password_hash($senha, PASSWORD_DEFAULT);
$token = bin2hex(random_bytes(32)); // Gera token de 64 caracteres

// Prepara o SQL com token e confirmado = 0
$stmt = $conn->prepare("INSERT INTO usuarios (nome, email, telefone, senha, confirmado, token_verificacao) VALUES (?, ?, ?, ?, 0, ?)");
if (!$stmt) {
    die("Erro interno ao preparar query.");
}
$stmt->bind_param("sssss", $nome, $email, $telefone, $senha_hash, $token);

if ($stmt->execute()) {
    // Cria link de verificação
    $link = "http://localhost/exp_trab/backend/verificar.php?token=$token";

    // Envia e-mail com o link
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->SMTPDebug = 0;
        $mail->Host = 'smtp.gmail.com';
        $mail->Port = 465;
        $mail->SMTPAuth = true;
        $mail->SMTPSecure = 'ssl';

        $mail->Username = 'jpedrocwb@gmail.com';
        $mail->Password = 'pqed vbng eniy mhnv';
        $mail->setFrom('jpedrocwb@gmail.com', 'Oblivion RPG');
        $mail->addAddress($email, $nome);

        $mail->isHTML(true);
        $mail->Subject = 'Confirmação de Cadastro - Oblivion';
        $mail->Body    = "Olá, <b>$nome</b>!<br>
        Para concluir seu cadastro no Oblivion, clique no link abaixo:<br><br>
        <a href='$link'>$link</a><br><br>
        Se você não realizou esse cadastro, ignore este e-mail.";

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
