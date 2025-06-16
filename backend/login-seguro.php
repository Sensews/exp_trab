<?php
require_once 'SecureEndpoint.php';
require_once 'conexao.php';

$endpoint = new SecureEndpoint();

try {
    // Recebe dados criptografados
    $dados = $endpoint->receiveData();
    
    $usuario = $dados['usuario'] ?? '';
    $senha = $dados['senha'] ?? '';

    if (empty($usuario) || empty($senha)) {
        $endpoint->sendData([
            "status" => "erro", 
            "mensagem" => "Preencha todos os campos."
        ]);
        exit;
    }

    // Lógica de autenticação normal...
    $conn = new mysqli("localhost", "root", "", "oblivion");
    
    if (preg_match('/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/', $usuario)) {
        $query = "SELECT id, nome, email, telefone, senha FROM usuarios WHERE telefone = ?";
    } else {
        $query = "SELECT id, nome, email, telefone, senha FROM usuarios WHERE email = ?";
    }

    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 0) {
        $endpoint->sendData([
            "status" => "erro", 
            "mensagem" => "Usuário não encontrado."
        ]);
        exit;
    }

    $usuarioDados = $resultado->fetch_assoc();

    if (!password_verify($senha, $usuarioDados['senha'])) {
        $endpoint->sendData([
            "status" => "erro", 
            "mensagem" => "Senha incorreta."
        ]);
        exit;
    }

    // Resposta criptografada
    $endpoint->sendData([
        "status" => "ok",
        "mensagem" => "Login bem-sucedido",
        "nome" => $usuarioDados['nome'],
        "email" => $usuarioDados['email'],
        "telefone" => $usuarioDados['telefone']
    ]);

} catch (Exception $e) {
    $endpoint->sendData([
        "status" => "erro",
        "mensagem" => "Erro no servidor: " . $e->getMessage()
    ]);
}