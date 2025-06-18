<?php
// Desativar exibição de erros para evitar HTML na resposta
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Sempre retorna JSON
header('Content-Type: application/json');

// Incluir classe de criptografia
require_once 'simple_crypto.php';

// Conexão com o banco
$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro ao conectar ao banco."]);
    exit;
}

// Função auxiliar
function normalizarTelefone($telefone) {
    return preg_replace('/\D/', '', $telefone);
}

// Função para debug
function debugLog($message) {
    error_log("[LOGIN DEBUG] " . $message, 3, "debug.log");
}

// Verificar se os dados estão criptografados
$encrypted_data = $_POST['encrypted_data'] ?? null;
$is_encrypted = !empty($encrypted_data);

debugLog("Iniciando login - Dados criptografados: " . ($is_encrypted ? "Sim" : "Não"));

// Pegar dados (criptografados ou não)
if ($is_encrypted) {
    debugLog("Processando dados criptografados de login");    try {
        $crypto = new SimpleCrypto();
        $decrypted_data = $crypto->decrypt($encrypted_data);
        
        if (!$decrypted_data) {
            debugLog("Erro: Falha ao descriptografar dados de login");
            echo json_encode(["status" => "erro", "mensagem" => "Dados inválidos."]);
            exit;
        }
        
        $usuario = $decrypted_data['usuario'] ?? '';
        $senha = $decrypted_data['senha'] ?? '';
        
        debugLog("Dados descriptografados com sucesso");
        
    } catch (Exception $e) {
        debugLog("Erro na descriptografia: " . $e->getMessage());
        echo json_encode(["status" => "erro", "mensagem" => "Erro ao processar dados."]);
        exit;
    }
} else {
    // Dados não criptografados (fallback)
    $usuario = $_POST['usuario'] ?? '';
    $senha = $_POST['senha'] ?? '';
    debugLog("Processando dados não criptografados");
}

if (empty($usuario) || empty($senha)) {
    echo json_encode(["status" => "erro", "mensagem" => "Preencha todos os campos."]);
    exit;
}

// Consulta por telefone ou email
if (preg_match('/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/', $usuario) || preg_match('/^\d{10,11}$/', $usuario)) {
    $query = "SELECT id, nome, email, telefone, senha FROM usuarios WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', ''), ' ', '') = ?";
    $param = normalizarTelefone($usuario);
} else {
    $query = "SELECT id, nome, email, telefone, senha FROM usuarios WHERE email = ?";
    $param = $usuario;
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

// Resposta final
echo json_encode([
    "status" => "ok",
    "mensagem" => "Login bem-sucedido",
    "nome" => $usuarioDados['nome'],
    "email" => $usuarioDados['email'],
    "telefone" => $usuarioDados['telefone'],
    "encrypted" => $is_encrypted
]);

$conn->close();
exit;
