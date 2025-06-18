<?php
// Desativar exibição de erros para evitar HTML na resposta
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Sempre retorna JSON
header('Content-Type: application/json');

// Incluir classe de criptografia
require_once 'simple_crypto.php';

try {
    // Conexão com o banco
    $conn = new mysqli("localhost", "root", "", "oblivion");
    if ($conn->connect_error) {
        throw new Exception("Erro ao conectar ao banco.");
    }

    // Função auxiliar
    function normalizarTelefone($telefone) {
        return preg_replace('/\D/', '', $telefone);
    }    // Verificar se os dados estão criptografados
    $encrypted_data = $_POST['encrypted_data'] ?? null;
    $is_encrypted = !empty($encrypted_data);

    // Pegar dados (criptografados ou não)
    if ($is_encrypted) {
        $crypto = new SimpleCrypto();
        $decrypted_data = $crypto->decrypt($encrypted_data);
        
        $usuario = $decrypted_data['usuario'] ?? '';
        $senha = $decrypted_data['senha'] ?? '';
        
    } else {
        // Dados não criptografados (fallback)
        $usuario = $_POST['usuario'] ?? '';
        $senha = $_POST['senha'] ?? '';
    }

    if (empty($usuario) || empty($senha)) {
        throw new Exception("Preencha todos os campos.");
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
        throw new Exception("Erro na preparação da consulta de usuário.");
    }
    
    $stmt->bind_param("s", $param);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        throw new Exception("Usuário não encontrado.");
    }

    $usuarioDados = $resultado->fetch_assoc();

    // Verificar senha
    if (!password_verify($senha, $usuarioDados['senha'])) {
        throw new Exception("Senha incorreta.");
    }

    // Buscar id_perfil
    $stmtPerfil = $conn->prepare("SELECT id_perfil FROM perfil WHERE id_usuario = ?");
    if (!$stmtPerfil) {
        throw new Exception("Erro ao buscar perfil.");
    }
    
    $stmtPerfil->bind_param("i", $usuarioDados['id']);
    $stmtPerfil->execute();
    $resultadoPerfil = $stmtPerfil->get_result();

    if ($resultadoPerfil->num_rows === 0) {
        throw new Exception("Perfil não encontrado para este usuário.");
    }    $perfilDados = $resultadoPerfil->fetch_assoc();
    $id_perfil = $perfilDados['id_perfil'];

    // Atualizar timestamp para sessão
    $timestamp_atual = time();

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

} catch (Exception $e) {
    echo json_encode([
        "status" => "erro", 
        "mensagem" => $e->getMessage()
    ]);
}

exit;
?>
