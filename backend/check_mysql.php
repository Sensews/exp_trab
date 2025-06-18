<?php
require_once 'conexao.php';

// Verificar configurações do MySQL
$result = $conexao->query("SHOW VARIABLES LIKE 'max_allowed_packet'");
$row = $result->fetch_assoc();

echo "Configuração atual do MySQL:\n";
echo "max_allowed_packet: " . number_format($row['Value'] / (1024*1024), 2) . " MB\n\n";

// Verificar tamanho das imagens existentes
$result = $conexao->query("SELECT id, LENGTH(imagem) as tamanho FROM posts WHERE imagem IS NOT NULL AND imagem != '' ORDER BY LENGTH(imagem) DESC LIMIT 5");

echo "Tamanhos das imagens nos posts:\n";
while ($row = $result->fetch_assoc()) {
    $tamanhoMB = number_format($row['tamanho'] / (1024*1024), 2);
    echo "Post ID: {$row['id']}, Tamanho: {$tamanhoMB} MB\n";
}

$conexao->close();
?>
