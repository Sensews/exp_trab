<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Redireciona se a sessão não existir
if (!isset($_SESSION['id_perfil']) || !isset($_SESSION['momento_login'])) {
    header("Location: ../frontend/erro.html");
    exit;
}

// Define tempo máximo de sessão (7 dias)
$tempo_maximo = 60 * 60 * 24 * 7;
$tempo_desde_login = time() - $_SESSION['momento_login'];

// Sessão expirada
if ($tempo_desde_login > $tempo_maximo) {
    $conn = new mysqli("localhost", "root", "", "oblivion");
    if (!$conn->connect_error) {
        $id_usuario = $_SESSION['id_usuario'] ?? null;
        $timestamp_logout = time();
        if ($id_usuario) {
            $stmt = $conn->prepare("UPDATE usuarios SET ultimo_logout = ? WHERE id = ?");
            if ($stmt) {
                $stmt->bind_param("ii", $timestamp_logout, $id_usuario);
                $stmt->execute();
                $stmt->close();
            }
        }
        $conn->close();
    }

    // Finaliza sessão
    session_unset();
    session_destroy();

    // Redireciona com aviso
    echo "
    <script>
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.href = '../frontend/login.html';
    </script>
    ";
    exit;
}

// Atualiza timestamp de último acesso
$_SESSION['ultimo_acesso'] = time();
