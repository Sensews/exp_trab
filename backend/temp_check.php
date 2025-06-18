<?php
require_once 'conexao.php';

$result = $conexao->query('SELECT id, LEFT(texto, 50) as texto, LENGTH(imagem) as img_size FROM posts ORDER BY id DESC LIMIT 5');

echo "Posts no banco de dados:\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: {$row['id']}, Texto: {$row['texto']}, Imagem: {$row['img_size']} bytes\n";
}

$conexao->close();
?>
