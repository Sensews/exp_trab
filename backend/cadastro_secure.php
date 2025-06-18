<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/../classes/HybridCrypto.php';
require_once __DIR__ . '/../classes/SecureDatabase.php';
include_once __DIR__ . '/limpar_pendentes.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once 'env_decoder.php';

header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Erro na conexão com o banco de dados."]));
}

// Verificar se é uma requisição criptografada
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Se há dados criptografados, usar criptografia híbrida
if ($data && isset($data['encryptedMessage']) && isset($data['encryptedAesKey']) && isset($data['aesIv'])) {
    try {
        // Descriptografar dados recebidos
        $decryptedData = HybridCrypto::decryptData(
            $data['encryptedMessage'],
            $data['encryptedAesKey'],
            $data['aesIv']
        );
        
        $nome = trim($decryptedData['nome'] ?? '');
        $email = trim($decryptedData['email'] ?? '');
        $telefone = trim($decryptedData['telefone'] ?? '');
        $senha = $decryptedData['senha'] ?? '';
        $confirma = $decryptedData['confirmar-senha'] ?? '';
        
    } catch (Exception $e) {
        http_response_code(400);
        die(json_encode(["error" => "Erro ao descriptografar dados: " . $e->getMessage()]));
    }
} else {
    // Fallback para dados não criptografados (compatibilidade)
    $nome = trim($_POST['nome'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $telefone = trim($_POST['telefone'] ?? '');
    $senha = $_POST['senha'] ?? '';
    $confirma = $_POST['confirmar-senha'] ?? '';
}

if ($senha !== $confirma) {
    http_response_code(400);
    die(json_encode(["error" => "As senhas não coincidem."]));
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
    die(json_encode(["error" => "A senha não é forte o suficiente."]));
}

// Verificar se email já existe (usando hash para privacidade)
$emailHash = hash('sha256', $email);
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $emailHash);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(400);
    die(json_encode(["error" => "E-mail já cadastrado."]));
}
$stmt->close();

// Verificar se telefone já existe (usando hash para privacidade)
$telefoneHash = hash('sha256', $telefone);
$stmt = $conn->prepare("SELECT id FROM usuarios WHERE telefone = ?");
$stmt->bind_param("s", $telefoneHash);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(400);
    die(json_encode(["error" => "Telefone já cadastrado."]));
}
$stmt->close();

// Criptografar dados sensíveis
try {
    $sensitiveData = [
        'email' => $email,
        'telefone' => $telefone
    ];
    
    $encrypted = HybridCrypto::encryptData($sensitiveData);
    
    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);
    $token = bin2hex(random_bytes(32));
    
    // Inserir usuário com dados criptografados
    $stmt = $conn->prepare("
        INSERT INTO usuarios (nome, email, telefone, senha, confirmado, token_verificacao, encrypted_data, aes_key, iv_data) 
        VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
    ");
    
    if (!$stmt) {
        http_response_code(500);
        die(json_encode(["error" => "Erro interno ao preparar query."]));
    }
    
    $stmt->bind_param("ssssssss", 
        $nome, 
        $emailHash, 
        $telefoneHash, 
        $senha_hash, 
        $token,
        $encrypted['encryptedData'],
        $encrypted['encryptedAesKey'],
        $encrypted['iv']
    );

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
                <p style='margin-top: 10px; font-size: 12px; color: #666;'>🔒 Seus dados estão protegidos com criptografia híbrida de alto nível.</p>
              </div>
            </body>
            </html>
            ";

            $mail->send();
            
            echo json_encode([
                "success" => true,
                "message" => "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.",
                "encrypted" => true
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            die(json_encode(["error" => "Erro ao enviar o e-mail de verificação: {$mail->ErrorInfo}"]));
        }

    } else {
        http_response_code(500);
        die(json_encode(["error" => "Erro ao cadastrar. Tente novamente."]));
    }
    
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode(["error" => "Erro na criptografia: " . $e->getMessage()]));
}

$conn->close();
?>
