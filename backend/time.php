<?php
session_start();

// Caso o usuário nunca tenha logado
if (!isset($_SESSION['id_perfil']) || !isset($_SESSION['momento_login'])) {
    header("Location: ../frontend/erro.html");
    exit;
}

// Tempo máximo (7 dias)
$tempo_maximo = 60 * 60 * 24 * 7;
$tempo_desde_login = time() - $_SESSION['momento_login'];

// Sessão expirada
if ($tempo_desde_login > $tempo_maximo) {
    // Conectar ao banco para registrar o logout
    $conn = new mysqli("localhost", "root", "", "oblivion");
    
    if (!$conn->connect_error) {
        // Opcional: Registrar o momento de logout
        $id_usuario = $_SESSION['id_usuario'];
        $timestamp_logout = time();
        $stmt = $conn->prepare("UPDATE usuarios SET ultimo_logout = ? WHERE id = ?");
        if ($stmt) {
            $stmt->bind_param("ii", $timestamp_logout, $id_usuario);
            $stmt->execute();
            $stmt->close();
        }
        $conn->close();
    }

    // Limpar a sessão
    session_unset();
    session_destroy();

    // Exibe alerta antes de redirecionar
    echo "
    <script>
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.href = '../frontend/login.html';
    </script>
    ";
    exit;
}

// Atualiza o timestamp de último acesso
$_SESSION['ultimo_acesso'] = time();
?>