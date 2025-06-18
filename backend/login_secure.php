<?php
// Ativar exibição de erros para debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Sempre retorna JSON
header('Content-Type: application/json');

require_once __DIR__ . '/../classes/HybridCrypto.php';
require_once __DIR__ . '/../classes/SecureDatabase.php';

// Conexão com o banco
$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro na conexão com o banco de dados."]);
    exit;
}

// Função auxiliar
function normalizarTelefone($telefone) {
    return preg_replace('/\D/', '', $telefone);
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
        
        $usuario = $decryptedData['usuario'] ?? '';
        $senha = $decryptedData['senha'] ?? '';
        $useCrypto = true;
        
    } catch (Exception $e) {
        echo json_encode(["status" => "erro", "mensagem" => "Erro ao descriptografar dados: " . $e->getMessage()]);
        exit;
    }
} else {
    // Fallback para dados não criptografados (compatibilidade)
    $usuario = $_POST['usuario'] ?? '';
    $senha = $_POST['senha'] ?? '';
    $useCrypto = false;
}

if (empty($usuario) || empty($senha)) {
    echo json_encode(["status" => "erro", "mensagem" => "Preencha todos os campos."]);
    exit;
}

// Consulta por telefone ou email usando hash
if (preg_match('/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/', $usuario) || preg_match('/^\d{10,11}$/', $usuario)) {
    $param = hash('sha256', normalizarTelefone($usuario));
    $query = "SELECT id, nome, email, telefone, senha, encrypted_data, aes_key, iv_data FROM usuarios WHERE telefone = ?";
    $isPhone = true;
} else {
    $param = hash('sha256', $usuario);
    $query = "SELECT id, nome, email, telefone, senha, encrypted_data, aes_key, iv_data FROM usuarios WHERE email = ?";
    $isPhone = false;
}

$stmt = $conn->prepare($query);
if (!$stmt) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro na preparação da consulta de usuário."]);
    exit;
}
$stmt->bind_param("s", $param);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 0) {
    echo json_encode(["status" => "erro", "mensagem" => "Usuário não encontrado."]);
    exit;
}

$usuarioDados = $resultado->fetch_assoc();

// Verificar senha
if (!password_verify($senha, $usuarioDados['senha'])) {
    echo json_encode(["status" => "erro", "mensagem" => "Senha incorreta."]);
    exit;
}

// Descriptografar dados sensíveis se disponíveis
$realEmail = $usuarioDados['email'];
$realTelefone = $usuarioDados['telefone'];

if (!empty($usuarioDados['encrypted_data']) && !empty($usuarioDados['aes_key']) && !empty($usuarioDados['iv_data'])) {
    try {
        $decryptedUserData = HybridCrypto::decryptData(
            $usuarioDados['encrypted_data'],
            $usuarioDados['aes_key'],
            $usuarioDados['iv_data']
        );
        
        $realEmail = $decryptedUserData['email'] ?? $realEmail;
        $realTelefone = $decryptedUserData['telefone'] ?? $realTelefone;
        
    } catch (Exception $e) {
        error_log("Erro ao descriptografar dados do usuário no login: " . $e->getMessage());
        // Continua com dados não criptografados
    }
}

// Buscar id_perfil
$stmtPerfil = $conn->prepare("SELECT id_perfil FROM perfil WHERE id_usuario = ?");
if (!$stmtPerfil) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro ao buscar perfil."]);
    exit;
}
$stmtPerfil->bind_param("i", $usuarioDados['id']);
$stmtPerfil->execute();
$resultadoPerfil = $stmtPerfil->get_result();

if ($resultadoPerfil->num_rows === 0) {
    echo json_encode(["status" => "erro", "mensagem" => "Perfil não encontrado para este usuário."]);
    exit;
}

$perfilDados = $resultadoPerfil->fetch_assoc();
$id_perfil = $perfilDados['id_perfil'];

// Atualizar último login
$timestamp_atual = time();
$stmtUpdateLogin = $conn->prepare("UPDATE usuarios SET ultimo_login = ? WHERE id = ?");
if ($stmtUpdateLogin) {
    $stmtUpdateLogin->bind_param("ii", $timestamp_atual, $usuarioDados['id']);
    $stmtUpdateLogin->execute();
}

// Iniciar sessão
session_start();
$_SESSION['id_usuario'] = $usuarioDados['id'];
$_SESSION['id_perfil'] = $id_perfil;
$_SESSION['usuario_nome'] = $usuarioDados['nome'];
$_SESSION['momento_login'] = $timestamp_atual;
$_SESSION['ultimo_acesso'] = $timestamp_atual;

// Preparar resposta
$response = [
    "status" => "ok",
    "mensagem" => "Login bem-sucedido",
    "nome" => $usuarioDados['nome'],
    "email" => $realEmail,
    "telefone" => $realTelefone,
    "encrypted" => $useCrypto
];

// Se a requisição foi criptografada, criptografar a resposta
if ($useCrypto) {
    try {
        $encryptedResponse = HybridCrypto::encryptData($response);
        echo json_encode([
            "status" => "ok",
            "encrypted" => true,
            "encryptedData" => $encryptedResponse['encryptedData'],
            "encryptedAesKey" => $encryptedResponse['encryptedAesKey'],
            "iv" => $encryptedResponse['iv']
        ]);
    } catch (Exception $e) {
        echo json_encode(["status" => "erro", "mensagem" => "Erro ao criptografar resposta: " . $e->getMessage()]);
    }
} else {
    echo json_encode($response);
}

$conn->close();
?>
