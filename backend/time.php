<?php
session_start();

// Caso o usuário nunca tenha logado
if (!isset($_SESSION['id_perfil']) || !isset($_SESSION['momento_login'])) {
    header("Location: erro.html");
    exit;
}

// Tempo máximo (7 dias)
$tempo_maximo = 60 * 60 * 24 * 7;
$tempo_desde_login = time() - $_SESSION['momento_login'];

// Sessão expirada
if ($tempo_desde_login > $tempo_maximo) {
    session_unset();
    session_destroy();

    // Exibe alerta antes de redirecionar
    echo "
    <script>
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        window.location.href = 'login.html';
    </script>
    ";
    exit;
}
?>