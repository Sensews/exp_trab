<?php
header('Content-Type: application/json');
$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    echo json_encode(["status" => "erro", "mensagem" => "Erro ao conectar ao banco."]);
    exit;
}

function normalizarTelefone($telefone) {
    return preg_replace('/\D/', '', $telefone);
}

// Dados recebidos via POST
$usuario = $_POST['usuario'] ?? '';
$senha = $_POST['senha'] ?? '';

// Verificação de campos vazios
if (empty($usuario) || empty($senha)) {
    echo json_encode(["status" => "erro", "mensagem" => "Preencha todos os campos."]);
    exit;
}

// Verifica se é telefone ou email
if (preg_match('/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/', $usuario) || preg_match('/^\d{10,11}$/', $usuario)) {
    $query = "SELECT id, nome, email, telefone, senha FROM usuarios WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, '(', ''), ')', ''), '-', ''), ' ', '') = ?";
    $param = normalizarTelefone($usuario);
} else {
    $query = "SELECT id, nome, email, telefone, senha FROM usuarios WHERE email = ?";
    $param = $usuario;
}

// Executa consulta segura
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $param);
$stmt->execute();
$resultado = $stmt->get_result();

// Verifica se encontrou o usuário
if ($resultado->num_rows === 0) {
    echo json_encode(["status" => "erro", "mensagem" => "Usuário não encontrado."]);
    exit;
}

$usuarioDados = $resultado->fetch_assoc();

// Verifica a senha
if (!password_verify($senha, $usuarioDados['senha'])) {
    echo json_encode(["status" => "erro", "mensagem" => "Senha incorreta."]);
    exit;
}

// Inicia sessão e armazena dados
session_start();
$_SESSION['id_usuario'] = $usuarioDados['id'];
$_SESSION['usuario_nome'] = $usuarioDados['nome'];
$_SESSION['momento_login'] = time(); // ⏱️ ESSENCIAL para expiração

// Retorna resposta de sucesso
echo json_encode([
    "status" => "ok",
    "mensagem" => "Login bem-sucedido",
    "nome" => $usuarioDados['nome'],
    "email" => $usuarioDados['email'],
    "telefone" => $usuarioDados['telefone']
]);

$conn->close();
