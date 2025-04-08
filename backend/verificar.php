<?php
$conn = new mysqli("localhost", "root", "", "oblivion");
if ($conn->connect_error) {
    $mensagem = "Erro ao conectar com o banco.";
} else {
    $token = $_GET['token'] ?? '';
    if (!$token) {
        $mensagem = "Token de verificação inválido.";
    } else {
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE token_verificacao = ? AND confirmado = 0");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $usuario = $result->fetch_assoc();
            $stmt = $conn->prepare("UPDATE usuarios SET confirmado = 1, token_verificacao = NULL WHERE id = ?");
            $stmt->bind_param("i", $usuario['id']);
            $stmt->execute();
            $mensagem = "✅ Sua conta foi confirmada! Você já pode fazer <a href='login.html'>login</a>.";
        } else {
            $mensagem = "❌ Token inválido ou conta já confirmada.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Confirmação de Conta</title>
    <link rel="stylesheet" href="../frontend/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <script defer src="../frontend/js/stars.js"></script>
</head>
<body>
    <header>
        <h1 class="logo" onclick="window.location.href='../frontend/main.html'">OBLIVION</h1>
        <nav>
            <button class="btn"><a href="../frontend/login.html">Login</a></button>
        </nav>
    </header>
    <main style="display:flex; align-items:center; justify-content:center; min-height:60vh;">
        <div class="content-box">
            <h2>Verificação de Conta</h2>
            <p><?php echo $mensagem; ?></p>
        </div>
    </main>
    <footer>
        <p>&copy; 2025 Oblivion RPG - Todos os direitos reservados.</p>
    </footer>
</body>
</html>
