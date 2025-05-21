<?php
session_start();

// Redireciona se não estiver logado ou não tiver registro do tempo de login
if (!isset($_SESSION['id_perfil']) || !isset($_SESSION['momento_login'])) {
    header("Location: erro.html");
    exit;
}

// Define o tempo máximo da sessão (1 minuto = 60 segundos)
$tempo_maximo = 60;
$tempo_desde_login = time() - $_SESSION['momento_login'];

// Se o tempo excedeu, destruir a sessão e redirecionar com alerta
if ($tempo_desde_login > $tempo_maximo) {
    session_unset();
    session_destroy();

    echo "
    <script>
        alert('Sua sessão expirou por inatividade. Faça login novamente.');
        window.location.href = 'login.html';
    </script>
    ";
    exit;
}
