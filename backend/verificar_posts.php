<?php
require_once 'conexao.php';

// Verificar estrutura da tabela posts
$sql = "DESCRIBE posts";
$result = $conexao->query($sql);

echo "Estrutura da tabela 'posts':\n";
while ($row = $result->fetch_assoc()) {
    echo sprintf("%-15s %-15s %-10s %-10s %-15s %-15s\n",
        $row['Field'],
        $row['Type'],
        $row['Null'],
        $row['Key'],
        $row['Default'],
        $row['Extra']
    );
}

// Verificar se há posts com imagens em arquivo
$sql = "SELECT id, imagem FROM posts WHERE imagem IS NOT NULL AND imagem != ''";
$result = $conexao->query($sql);

echo "\nPosts com imagens encontrados:\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Imagem: {$row['imagem']}\n";
}

$conexao->close();
?>
