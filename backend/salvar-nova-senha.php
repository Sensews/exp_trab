<?php
$conn = new mysqli("localhost", "root", "", "oblivion");
$mensagem = '';

if ($conn->connect_error) {
    $mensagem = "❌ Erro ao conectar com o banco de dados.";
} else {
    $token = $_POST['token'] ?? '';
    $novaSenha = $_POST['nova_senha'] ?? '';
    $confirmarSenha = $_POST['confirmar_senha'] ?? '';

    if (!$token || !$novaSenha || !$confirmarSenha) {
        $mensagem = "❌ Dados incompletos.";
    } elseif ($novaSenha !== $confirmarSenha) {
        $mensagem = "❌ As senhas não coincidem.";
    } else {
        // Verifica se o token ainda é válido
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE token_recuperacao = ? AND recuperacao_expira_em > NOW()");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows !== 1) {
            $mensagem = "❌ Token inválido ou expirado.";
        } else {
            $row = $result->fetch_assoc();
            $usuarioId = $row['id'];
            $hashSenha = password_hash($novaSenha, PASSWORD_DEFAULT);

            $update = $conn->prepare("UPDATE usuarios SET senha = ?, token_recuperacao = NULL, recuperacao_expira_em = NULL WHERE id = ?");
            $update->bind_param("si", $hashSenha, $usuarioId);

            if ($update->execute()) {
                $mensagem = "✅ Senha redefinida com sucesso!<br><br><a href='../frontend/login.html' class='btn'>Fazer login</a>";
            } else {
                $mensagem = "❌ Erro ao atualizar a senha. Tente novamente.";
            }
        }
    }
    $conn->close();
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Senha Redefinida</title>
    <link rel="stylesheet" href="../frontend/css/style.css">
    <link rel="stylesheet" href="../frontend/css/recuperar-senha.css">
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
        <div class="content-box" style="text-align: center;">
            <h2>Resultado da Redefinição</h2>
            <p style="margin-top: 20px;"><?php echo $mensagem; ?></p>
        </div>
    </main>

    <footer>
        <p>&copy; 2025 Oblivion RPG - Todos os direitos reservados.</p>
    </footer>
</body>
</html>
