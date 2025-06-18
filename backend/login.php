<?php
// Ativar exibição de erros para debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Sempre retorna JSON
header('Content-Type: application/json');

// Importar CryptoManagerSimple para criptografia simples
require_once __DIR__ . '/crypto/CryptoManagerSimple.php';

try {
    $crypto = CryptoManagerSimple::getInstance();
} catch (Exception $e) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro de segurança do sistema."]);
    error_log("Erro CryptoManagerSimple login: " . $e->getMessage());
    exit;
}

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

// Pegar dados
$dadosRecebidos = null;
$input = file_get_contents('php://input');

if (!empty($input)) {
    // Dados via JSON (possivelmente criptografados)
    $jsonData = json_decode($input, true);
    if ($jsonData && $crypto->isEncryptedRequest($jsonData)) {
        try {
            $dadosRecebidos = $crypto->decryptRequest($jsonData);
        } catch (Exception $e) {
            echo json_encode(["status" => "erro", "mensagem" => "Erro ao descriptografar dados."]);
            error_log("Erro decriptografia login: " . $e->getMessage());
            exit;
        }
    } else {
        $dadosRecebidos = $jsonData ?: $_POST;
    }
} else {
    // Dados via POST tradicional
    $dadosRecebidos = $_POST;
}

$usuario = $dadosRecebidos['usuario'] ?? '';
$senha = $dadosRecebidos['senha'] ?? '';

if (empty($usuario) || empty($senha)) {
    $response = ["status" => "erro", "mensagem" => "Preencha todos os campos."];
    echo json_encode($crypto->processResponse($response, false)); // Não criptografar erros simples
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
    $response = ["status" => "erro", "mensagem" => "Usuário não encontrado."];
    echo json_encode($crypto->processResponse($response, false));
    exit;
}

$usuarioDados = $resultado->fetch_assoc();

// Verificar senha
if (!password_verify($senha, $usuarioDados['senha'])) {
    $response = ["status" => "erro", "mensagem" => "Senha incorreta."];
    echo json_encode($crypto->processResponse($response, false));
    exit;
}

// Buscar id_perfil
$stmtPerfil = $conn->prepare("SELECT id_perfil FROM perfil WHERE id_usuario = ?");
if (!$stmtPerfil) {
    $response = ["status" => "erro", "mensagem" => "Erro ao buscar perfil."];
    echo json_encode($crypto->processResponse($response, false));
    exit;
}
$stmtPerfil->bind_param("i", $usuarioDados['id']);
$stmtPerfil->execute();
$resultadoPerfil = $stmtPerfil->get_result();

if ($resultadoPerfil->num_rows === 0) {
    $response = ["status" => "erro", "mensagem" => "Perfil não encontrado para este usuário."];
    echo json_encode($crypto->processResponse($response, false));
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

// Resposta final criptografada
try {
    $response = $crypto->encryptResponse([
        "status" => "ok",
        "mensagem" => "Login bem-sucedido",
        "nome" => $usuarioDados['nome'],
        "email" => $usuarioDados['email'],
        "telefone" => $usuarioDados['telefone']
    ]);
    echo json_encode($response);
} catch (Exception $e) {
    error_log("Erro ao criptografar resposta login: " . $e->getMessage());
    echo json_encode(["status" => "erro", "mensagem" => "Erro de segurança na resposta."]);
}

$conn->close();
