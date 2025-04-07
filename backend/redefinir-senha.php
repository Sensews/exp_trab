<?php
$conn = new mysqli("localhost", "root", "", "oblivion");
$mensagem = '';
$formularioVisivel = false;

if ($conn->connect_error) {
    $mensagem = "Erro ao conectar com o banco de dados.";
} else {
    $token = $_GET['token'] ?? '';
    if (!$token) {
        $mensagem = "Token de redefinição inválido.";
    } else {
        // Verifica se o token é válido e ainda está dentro do prazo de 1 hora
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE token_recuperacao = ? AND recuperacao_expira_em > NOW()");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $formularioVisivel = true;
        } else {
            $mensagem = "Token inválido ou expirado.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Redefinir Senha</title>
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
        <div class="content-box">
            <h2>Redefinir Senha</h2>

            <?php if ($formularioVisivel): ?>
                <form method="POST" action="salvar-nova-senha.php">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                    <div class="input-box">
                        <label for="nova_senha">Nova Senha</label>
                        <input type="password" id="nova_senha" name="nova_senha" placeholder="Digite a nova senha" required>
                    </div>
                    <div class="input-box">
                        <label for="confirmar_senha">Confirmar Nova Senha</label>
                        <input type="password" id="confirmar_senha" name="confirmar_senha" placeholder="Confirme a nova senha" required>
                    </div>
                    <button class="btn" type="submit">Salvar Senha</button>
                </form>
            <?php else: ?>
                <p><?php echo $mensagem; ?></p>
            <?php endif; ?>
        </div>
    </main>

    <footer>
        <p>&copy; 2025 Oblivion RPG - Todos os direitos reservados.</p>
    </footer>
</body>
</html>
